const EventEmitter = require('events');
const GameState = require('./gamestate');
const Table = require('./table');
const Dealer = require('./dealer');
const Player = require('./player');
const Deck = require('./deck');
const Pot = require('./pot');
const Card = require('./card');

class GameEvent extends EventEmitter { }

class Game {
    constructor(id, positions, buttonPosition) {
        this.id = id;

        this.positions = positions;
        this.buttonPosition = buttonPosition;

        const potOptions = { blind: 10 };
        const dealerOptions = { cap: 3 };
        const playerOptions = { maxPlayersAllowed: 9 };

        this.deck = new Deck();
        this.pot = new Pot(potOptions);
        this.dealer = new Dealer(dealerOptions);
        this.player = new Player(playerOptions);
        this.gameEvent = new GameEvent();

        this.currentState = 'blind';
        this.currentTurnId = -1;

        this.turnStateTable = new Map();

        this.leadPlayer = {
            id: -1,
            betAmount: 0
        };

        this.states = new Map([
            ['blind', { isOpen: true }],
            ['deal', { isOpen: true }],
            ['flop', { isOpen: true }],
            ['turn', { isOpen: true }],
            ['river', { isOpen: true }],
        ]);

        this.gameEvent.once('game-start', (onstart) => {
            this.dealer.initialise(this.deck);

            this.player.initialise({
                positions: this.positions,
                dealerPositionIndex: this.buttonPosition
            });

            onstart(this.id);

            const sb = this.player.byOrderIndex(0);
            const bb = this.player.byOrderIndex(1);
            const turn = this.takeTurn(sb, this.currentState, this.currentTurnId, this.pot.options.blind * 0.5);

            this.currentTurnId = turn.id;
            this.leadPlayer.id = bb.id;
            this.leadPlayer.betAmount = this.pot.options.blind;
        });
    };

    takeTurn(player, currentState, lastTurnId, matchBetAmount) {
        const turn = this.startTurn(player, currentState, lastTurnId, matchBetAmount);
        const state = {
            state: currentState,
            turnId: turn.id
        };

        this.gameEvent.emit('enter-turn', player, state, turn);

        for (const p of this.player.allValid) {
            this.gameEvent.emit('state', p[1], player, state, this.pot);
        }

        return turn;
    }

    validateTurn(playerId, actionType, betAmount) {
        const player = this.player.byId(playerId);
        const completedTurnId = this.currentTurnId;

        {
            console.log(`\nvalidate turn ${completedTurnId}:\n\tpid: ${player.id}\n\tbet order index: ${player.betOrderIndex}\n\taction type: ${actionType}\n\tbet amount: ${betAmount}`);
        }

        const stateChange = this.endTurn(playerId, completedTurnId, actionType, betAmount);

        let state = this.currentState;

        if (stateChange) {
            state = this.nextState(state);
        }

        this.currentState = state;

        const betOrderIndexNext = this.player.nextBetOrderIndex(player.betOrderIndex, 0);
        const playerNext = this.player.byOrderIndex(betOrderIndexNext);
        const prevBet = this.pot.options.blind > betAmount ? this.pot.options.blind : betAmount;
        const owes = prevBet - playerNext.bets[state];
        const turn = this.takeTurn(playerNext, this.currentState, completedTurnId, owes);

        this.currentTurnId = turn.id;
    }

    startTurn(player, state, turnid, matchAmount) {
        const betOrderIndex = player.betOrderIndex;
        const nextTurnId = turnid + 1;

        this.turnStateTable.set(nextTurnId, {
            playerId: player.id,
            round: state,
            isCompleted: false
        });

        {
            console.log(`turn started for turnid: ${nextTurnId}\n\tbet order index: ${betOrderIndex}`);
            console.log(`\tcurrent game state: ${this.currentState}`);
            console.log(`\tmatch amount: ${matchAmount}`);
        }

        const turnData = {
            id: nextTurnId,
            actions: [],
            owes: matchAmount
        };

        if ((betOrderIndex === 0 || betOrderIndex === 1) && state === 'blind') {
            turnData.actions.push('blind');
        } else {
            turnData.actions.push('fold');

            if (this.states.get(state).isOpen) {
                turnData.actions.push('bet');

                if (turnData.owes <= 0) {
                    turnData.owes = this.pot.options.blind;
                }
            } else {
                if (turnData.owes > 0) {
                    turnData.actions.push('call');
                } else {
                    turnData.actions.push('check');
                }
            }

            turnData.actions.push('raise');
        }

        {
            console.log(`turn data for turn: ${turnData.id}:`);
            console.log(turnData);
        }

        return turnData;
    }

    endTurn(pid, turnid, actionType, betAmount) {
        const player = this.player.byId(pid);
        const state = this.currentState;
        const turnState = this.turnStateTable.get(turnid);

        {
            console.log(`ending turn\n\tturnid: ${turnid}`);
            console.log(turnState);
        }

        if (turnState.isCompleted) {
            console.log(`error: turn state already completed`);
            console.log(turnState);
            return;
        }

        let changeState = false;

        if (actionType === 'fold') {
            console.log(`${player.id} folded on turn id ${turnid}`);
            player.hasFolded = true;
        } else {
            const bet = this.pot.placeBet(state, betAmount);

            player.bets[state] += betAmount;

            {
                console.log(`player placed a bet\n\tpid: ${player.id}\n\tamount: ${betAmount}\n\ttotal pot contribution: ${player.potContribution}\n\ton turn id: ${turnid}`);
            }

            if (betAmount > 0 && this.states.get(state).isOpen) {
                console.log(`opening bet placed\n\tby player: ${player.id}\n\ton turn id: ${turnid}`);
                this.states.get(state).isOpen = false;
            }

            if (pid === this.leadPlayer.id) {
                console.log(`reached leading player\n\tleading player id: ${player.id}\n\ton turn id: ${turnid}`);
                if (actionType !== 'bet' && actionType !== 'raise') {
                    console.log(`leading player did not bet or raise`);
                    changeState = true;
                }
            } else {
                if (betAmount > this.leadPlayer.betAmount) {
                    console.log(`player just became the new lead\n\tplayer id: ${player.id}\n\ton turn id:: ${turnid}`)
                    this.leadPlayer.id = pid;
                    this.leadPlayer.betAmount = betAmount;
                }
            }
        }

        {
            console.log(`pot\n\ttotal: ${this.pot.size}\n\tcurrent: ${this.pot.sizeCurrent}`);
        }

        this.player.update(player);

        return changeState;
    }

    nextState(current) {
        let next = current;
        
        switch (current) {
            case 'blind':
                this.gameEvent.emit(
                    'deal-holecards',
                    this.player.allValid,
                    this.dealer.dealHolecards(this.player.states)
                );

                const sb = this.player.byOrderIndex(0);
                const bb = this.player.byOrderIndex(1);

                sb.bets['deal'] += sb.bets['blind'];
                bb.bets['deal'] += bb.bets['blind'];

                next = 'deal';
                
                break;
            case 'deal':
                this.gameEvent.emit(
                    'deal-flop',
                    this.blindBetSize,
                    this.dealer.dealFlop()
                );

                this.leadPlayer = [...this.player.states].find(p => p[1].isDealer);
                this.player.consolidateBets('deal');

                next = 'flop';
                
                break;
            case 'flop':
                this.gameEvent.emit(
                    'deal-turn',
                    this.dealer.dealNextCard()
                );
                
                this.leadPlayer = [...this.player.states].find(p => p[1].isDealer);
                this.player.consolidateBets('flop');
                
                next = 'turn';
                
                break;
            case 'turn':
                this.player.consolidateBets('turn');
                next = 'river';
                break;
            default:
                next = 'invalid';
                break;
        }
        
        this.pot.collectBets();
        
        return next;
    }

    playerNameLookupBySeat(i) {
        return this.positions.find(([k, v]) => k === i)[1].state.name;
    }
}

module.exports = Game;