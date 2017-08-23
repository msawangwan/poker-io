const EventEmitter = require('events');
const Util = require('util');
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

        this.actingPlayer = {
            id: -1,
        }

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
            this.actingPlayer.id = sb.id;
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

        Game.logState(
            `validate turn`,
            null,
            `turn id: ${completedTurnId}`,
            `game state ${this.currentState}`,
            `player id: ${player.id}`,
            `bet order index: ${player.betOrderIndex}`,
            `action type: ${actionType}`,
            `bet amount: ${betAmount}`
        );

        const turnResult = this.endTurn(
            playerId,
            completedTurnId,
            this.currentState,
            actionType,
            betAmount
        );

        if (!turnResult.isValid) {
            Game.logState(
                `invalid turn result`,
                turnResult,
                `rejecting turn id ${completedTurnId} from player: ${playerId}`
            );

            return false;
        }

        let state = this.currentState;

        if (turnResult.changeState) {
            state = this.nextState(state);
        }

        this.currentState = state;

        const acting = this.player.byId(this.actingPlayer.id);
        const betOrderIndexNext = this.player.nextBetOrderIndex(acting.betOrderIndex, 0);
        const playerNext = this.player.byOrderIndex(betOrderIndexNext);
        const prevBet = this.pot.options.blind > betAmount ? this.pot.options.blind : betAmount;
        const owes = prevBet - playerNext.bets[state];
        const turn = this.takeTurn(playerNext, this.currentState, completedTurnId, owes);

        this.actingPlayer.id = playerNext.id;

        this.currentTurnId = turn.id;

        return true;
    }

    startTurn(player, state, turnid, matchAmount) {
        const betOrderIndex = player.betOrderIndex;
        const nextTurnId = turnid + 1;

        this.turnStateTable.set(nextTurnId, {
            turnId: nextTurnId,
            playerId: player.id,
            round: state,
            matchAmount: matchAmount,
            isCompleted: false
        });

        Game.logState(
            `start turn`,
            null,
            `turn id: ${nextTurnId}`,
            `game state ${state}`,
            `player id: ${player.id}`,
            `bet order index: ${player.betOrderIndex}`,
            `match amount: ${matchAmount}`
        );

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
                // if (turnData.owes > 0) {
                //     turnData.actions.push('call');
                // } else {
                //     turnData.actions.push('check');
                // }
            }

            if (turnData.owes > 0 && !turnData.actions.includes('bet')) {
                turnData.actions.push('call');
            } else {
                turnData.actions.push('check');
            }

            turnData.actions.push('raise');
        }

        Game.logState(
            `turn data for ${turnData.id}`,
            turnData
        );

        return turnData;
    }

    endTurn(pid, turnid, state, actionType, betAmount) {
        const player = this.player.byId(pid);
        const turnState = this.turnStateTable.get(turnid);

        Game.logState(
            `end turn`,
            turnState,
            `turn id: ${turnid}`,
            `game state: ${state}`,
            `player id: ${player.id}`,
            `bet amount: ${betAmount}`
        );

        const result = {
            isValid: false, changeState: false
        };

        if (turnState.isCompleted) {
            Game.logState(
                `err: state mismatch`,
                null,
                `already completed this turn?`
            );

            return result;
        } else if (turnState.playerId !== pid) {
            Game.logState(
                `err: state mismatch`,
                null,
                `expected player: ${turnState.playerId}`,
                `got player: ${pid}`
            );

            return result;
        }

        if (actionType === 'fold') {
            player.hasFolded = true;
        } else {
            const bet = this.pot.placeBet(state, betAmount);

            player.bets[state] += betAmount;

            Game.logState(
                `bet placed`,
                bet
            );

            if (betAmount > 0 && this.states.get(state).isOpen) {
                this.states.get(state).isOpen = false;
            }

            if (pid === this.leadPlayer.id) {
                if (actionType !== 'bet' && actionType !== 'raise') {
                    // changeState = true;
                    result.changeState = true;
                }
            } else {
                if (betAmount > this.leadPlayer.betAmount) {
                    this.leadPlayer.id = pid;
                    this.leadPlayer.betAmount = betAmount;
                }
            }
        }

        Game.logState(
            `pot state`,
            null,
            `turn id: ${turnid}`,
            `total: ${this.pot.size}`,
            `current: ${this.pot.sizeCurrent}`
        );

        turnState.isCompleted = true;
        result.isValid = true;

        this.turnStateTable.set(turnState.id, turnState);
        this.player.update(player);

        // return changeState;
        return result;
    }

    nextState(current) {
        let next = current;

        const clear = (round) => {
            const dealer = [...this.player.states].find(p => p[1].isDealer)[1];

            this.actingPlayer.id = dealer.id;
            this.leadPlayer.id = dealer.id;

            this.player.consolidateBets(round);
        };

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

                this.states.get(next).isOpen = false;

                break;
            case 'deal':
                this.gameEvent.emit(
                    'deal-flop',
                    this.blindBetSize,
                    this.dealer.dealFlop()
                );

                clear(current);
                next = 'flop';

                break;
            case 'flop':
                this.gameEvent.emit(
                    'deal-turn',
                    this.dealer.dealNextCard()
                );

                clear(current);
                next = 'turn';

                break;
            case 'turn':
                this.gameEvent.emit(
                    'deal-river',
                    this.dealer.dealNextCard()
                );

                clear(current);
                next = 'river';

                break;
            case 'river':
                break;
            default:
                next = 'invalid';
                break;
        }

        this.pot.collectBets();

        Game.logState(
            `state change`,
            null,
            `from: ${current}`,
            `to: ${next}`
        );

        return next;
    }

    playerNameLookupBySeat(i) {
        return this.positions.find(([k, v]) => k === i)[1].state.name;
    }

    static logState(msg, o, ...lines) {
        console.log('\n');
        console.count('[game state]');
        console.log(`${msg}`);

        if (o) {
            const s = Util.format('\t%O', o);
            console.log(`\n`);
            console.dir(o, { depth: null, colors: true });
            console.log(`\n`);
        }

        for (const l of lines) {
            console.log(`\t${l}`);
        }
    }
}

module.exports = Game;