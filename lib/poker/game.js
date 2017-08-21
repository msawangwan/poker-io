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
            const turn = this.startTurn(0, this.pot.options.blind * 0.5);

            this.leadPlayer.id = bb.id;
            this.leadPlayer.betAmount = this.pot.options.blind;

            console.log('turn data:');
            console.log(turn);

            const state = {
                state: this.currentState,
                turnId: this.currentTurnId
            };

            this.gameEvent.emit('enter-turn', sb, state, turn);

            for (const p of this.player.allValid) {
                this.gameEvent.emit('state', p[1], sb, state, this.pot);
            }
        });
    };

    validateTurn(playerId, actionType, betAmount) {
        const player = this.player.byId(playerId);

        {
            console.log(`\nvalidate turn ${this.currentTurnId}:\npid: ${player.id}\nbet order index: ${player.betOrderIndex}\nbet amount: ${betAmount}`);
        }

        const stateChange = this.endTurn(playerId, actionType, betAmount);

        let state = this.currentState;

        if (stateChange) {
            state = this.nextState(state);
            this.pot.collectBets();
        }

        this.currentState = state;

        const betOrderIndexNext = this.player.nextBetOrderIndex(player.betOrderIndex, 0);
        const playerNext = this.player.byOrderIndex(betOrderIndexNext);
        const prevBet = this.pot.options.blind > betAmount ? this.pot.options.blind : betAmount;
        const owes = prevBet - playerNext.potContribution;
        const turn = this.startTurn(betOrderIndexNext, owes);

        const updatedState = {
            state: this.currentState,
            turnId: turn.id
        };

        this.gameEvent.emit('enter-turn', playerNext, updatedState, turn);

        for (const p of this.player.allValid) {
            this.gameEvent.emit('state', p[1], playerNext, updatedState, this.pot);
        }
    }

    startTurn(betOrderIndex, matchAmount) {
        this.currentTurnId += 1;

        {
            console.log(`turn started for turnid: ${this.currentTurnId}\nbet order index: ${betOrderIndex}`);
            console.log(`current game state: ${this.currentState}`);
            console.log(`match amount: ${matchAmount}`);
        }

        const turnData = {
            id: this.currentTurnId,
            actions: [],
            owes: matchAmount
        };

        const state = this.currentState;

        if ((betOrderIndex === 0 || betOrderIndex === 1) && state === 'blind') {
            turnData.actions.push('blind');
        } else {
            turnData.actions.push('fold');

            if (this.states.get(state).isOpen) {
                turnData.actions.push('bet');

                if (turnData.owes < 0) {
                    turnData.owes = 0;
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

    endTurn(pid, actionType, betAmount) {
        const player = this.player.byId(pid);
        const state = this.currentState;

        {
            console.log(`ending turn\nturnid: ${this.currentTurnId}`);
        }

        let changeState = false;

        if (actionType === 'fold') {
            player.hasFolded = true;
        } else {
            const bet = this.pot.placeBet(state, betAmount);

            player.potContribution += betAmount;

            if (betAmount > 0) {
                this.states.get(state).isOpen = false;
            }

            if (pid === this.leadPlayer.id) {
                if (actionType !== 'bet' && actionType !== 'raise') {
                    console.log(`reached lead player on turn id: ${this.currentTurnId}`);
                    changeState = true;
                }
            } else {
                if (betAmount > this.leadPlayer.betAmount) {
                    this.leadPlayer.id = pid;
                    this.leadPlayer.betAmount = betAmount;
                }
            }
        }

        {
            console.log(`pot\ntotal: ${this.pot.size}\ncurrent: ${this.pot.sizeCurrent}`);
        }

        this.player.update(player);

        return changeState;
    }

    nextState(current) {
        switch (current) {
            case 'blind':
                this.gameEvent.emit(
                    'deal-holecards',
                    this.player.allValid,
                    this.dealer.dealHolecards(this.player.states)
                );

                return 'deal';
            case 'deal':
                this.gameEvent.emit(
                    'deal-flop',
                    this.blindBetSize,
                    this.dealer.dealFlop()
                );

                this.leadPlayer = [...this.player.states].find(p => p[1].isDealer);

                return 'flop';
            case 'flop':
                return 'turn';
            case 'turn':
                return 'river';
            default:
                return 'invalid';
        }
    }

    playerNameLookupBySeat(i) {
        return this.positions.find(([k, v]) => k === i)[1].state.name;
    }
}

module.exports = Game;