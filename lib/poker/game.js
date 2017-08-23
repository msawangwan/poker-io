const EventEmitter = require('events');
const Util = require('util');
const Table = require('./table');
const Board = require('./board');
const House = require('./house');
// const Dealer = require('./dealer');
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
        this.board = new Board();
        this.house = new House(this.deck);
        this.pot = new Pot(potOptions);
        // this.dealer = new Dealer(dealerOptions);
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
            ['blind', { isOpen: true, roundCap: 0 }],
            ['deal', { isOpen: true, roundCap: 0 }],
            ['flop', { isOpen: true, roundCap: 0 }],
            ['turn', { isOpen: true, roundCap: 0 }],
            ['river', { isOpen: true, roundCap: 0 }],
        ]);

        this.gameEvent.once('game-start', (onstart) => {
            // this.dealer.initialise(this.deck);

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

    validateTurn(playerId, actionType, betAmount) {
        const player = this.player.byId(playerId);
        const completedTurnId = this.currentTurnId;

        Game.logState(
            `validate turn`,
            null,
            false,
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
                false,
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
        const matchAmount = prevBet - playerNext.bets[state];
        const turn = this.takeTurn(playerNext, this.currentState, completedTurnId, matchAmount);

        this.actingPlayer.id = playerNext.id;

        this.currentTurnId = turn.id;

        return true;
    }

    takeTurn(player, currentState, lastTurnId, matchBetAmount) {
        const turn = this.startTurn(player, currentState, lastTurnId, matchBetAmount);
        const state = {
            state: turn.round,
            turnId: turn.id
        };

        this.turnStateTable.set(turn.id, turn);

        Game.logState(`turn state table`, this.turnStateTable, true);

        this.gameEvent.emit('enter-turn', player, state, turn);

        for (const p of this.player.allValid) {
            this.gameEvent.emit('state', p[1], player, state, this.pot);
        }

        return turn;
    }

    startTurn(player, state, turnid, matchAmount) {
        const turn = {
            id: turnid + 1,
            round: state,
            completed: false,
            matchAmount: matchAmount,
            actingId: player.id,
            actingOrder: player.betOrderIndex,
            actions: []
        };

        if (turn.round === 'blind') {
            if (turn.actingOrder === 0 || turn.actingOrder === 1) {
                turn.actions.push('blind');
            } else {
                Game.logStateErr(
                    `state mismatch`,
                    null,
                    false,
                    `this player isn't the expected blind and we're not setup to handle this`
                );
            }
        } else {
            turn.actions.push('fold');

            if (this.states.get(turn.round).isOpen) {
                turn.actions.push('bet');

                if (turn.matchAmount <= 0) {
                    turn.matchAmount = this.pot.options.blind;
                }
            }

            if (turn.matchAmount > 0 && !turn.actions.includes('bet')) {
                turn.actions.push('call');
            } else {
                turn.actions.push('check');
            }

            turn.actions.push('raise');
        }

        Game.logState(
            `started turn`,
            turn,
            false,
        );

        return turn;
    }

    endTurn(pid, turnid, state, actionType, betAmount) {
        const result = { isValid: false, changeState: false };
        const player = this.player.byId(pid);
        const turn = this.turnStateTable.get(turnid);

        if (turn.completed) {
            Game.logStateErr(
                `state mismatch`,
                null,
                false,
                `already completed this turn?`
            );

            return result;
        } else if (turn.actingId !== pid) {
            Game.logStateErr(
                `state mismatch`,
                null,
                false,
                `expected player: ${turn.playerId}`,
                `got player: ${pid}`
            );

            return result;
        }

        if (!turn.actions.includes(actionType)) {
            Game.logStateErr(`action isn't allowed for player`, null, false);
            return result;
        }

        if (player.hasFolded) {
            result.isValid = true;
            return result;
        }

        if (actionType === 'fold') {
            player.hasFolded = true;
        }

        const bet = this.pot.placeBet(pid, state, actionType, betAmount);

        // todo: DO THIS IN THE POT OR PLAYER FUNCS?
        player.bets[state] += bet.amount;

        Game.logState(
            `bet placed`,
            bet,
            false
        );

        if (bet.amount > 0 && this.states.get(state).isOpen) {
            this.states.get(state).isOpen = false;
        }

        if (bet.betterid === this.leadPlayer.id) {
            this.states.get(state).capCount += 1;
            if (bet.type === 'blind' || bet.type === 'check') {
                result.changeState = true;
            }
        }

        if (bet.amount > this.leadPlayer.betAmount) {
            this.leadPlayer.id = pid;
            this.leadPlayer.betAmount = bet.amount;
        }

        turn.completed = true;
        result.isValid = true;

        {
            Game.logState(
                `ended turn`,
                turn,
                false
            );

            Game.logState(
                `pot state`,
                null,
                false,
                `turn id: ${turnid}`,
                `total: ${this.pot.size}`,
                `current: ${this.pot.sizeCurrent}`
            );
        }

        this.turnStateTable.set(turn.id, turn);
        this.player.update(player);

        return result;
    }

    // A betting round ends when two conditions are met:
    // 1) All players have had a chance to act.
    // 2) All players who haven't folded have bet the same amount of money for the round

    nextState(current) {
        let next = current;

        const clear = (round) => {
            const button = [...this.player.states].find(p => p[1].isDealer)[1];

            this.actingPlayer.id = button.id;
            this.leadPlayer.id = button.id;

            this.player.consolidateBets(round);
        };

        switch (current) {
            case 'blind':
                const sb = this.player.byOrderIndex(0);
                const bb = this.player.byOrderIndex(1);

                sb.bets['deal'] += sb.bets['blind'];
                bb.bets['deal'] += bb.bets['blind'];

                this.states.get(next).isOpen = false;

                const playerIds = this.player.ids;
                const hands = this.house.deal('hand', playerIds);

                this.gameEvent.emit('deal-player-cards', {
                    ids: playerIds,
                    cards: hands
                });

                next = 'deal';

                break;
            // case 'deal':
            //     const flop = this.house.deal('flop');

            //     this.gameEvent.emit('deal-community-cards', {
            //         round: 'flop',
            //         cards: flop
            //     });

            //     clear(current);
            //     next = 'flop';

            //     break;
            // case 'flop':
            //     const turn = this.house.deal('turn');

            //     this.gameEvent.emit('deal-community-cards', {
            //         round: 'turn',
            //         cards: turn
            //     });

            //     clear(current);
            //     next = 'turn';

            //     break;
            // case 'turn':
            //     const river = this.house.deal('river');

            //     this.gameEvent.emit('deal-community-cards', {
            //         round: 'river',
            //         cards: river
            //     });

            //     clear(current);
            //     next = 'river';

            //     break;
            case 'river':
                break;
            default:
                let round = current;

                switch (current) {
                    case 'deal':
                        round = 'flop';
                        break;
                    case 'flop':
                        round = 'turn';
                        break;
                    case 'turn':
                        round = 'river';
                        break;
                }

                const cards = this.house.deal(round);

                this.gameEvent.emit('deal-community-cards', {
                    round: round,
                    cards: cards
                });

                clear(current);
                next = round;

                break;
        }

        this.pot.collectBets();

        Game.logState(
            `state change`,
            null,
            false,
            `from: ${current}`,
            `to: ${next}`
        );

        return next;
    }

    playerNameLookupBySeat(i) {
        return this.positions.find(([k, v]) => k === i)[1].state.name;
    }

    // for custom logging on a per object basis see:
    // https://nodejs.org/docs/latest/api/util.html#util_custom_inspection_functions_on_objects
    // for client side logging see:
    // https://developer.mozilla.org/en-US/docs/Web/API/Console

    static logState(msg, o, breaklines, ...lines) {
        const header = '[GAMESTATE UPDATED]';

        console.log('\n');
        console.count(`${header}`);
        console.log(`${msg}`);

        if (o) {
            const s = Util.inspect(o, {
                depth: 4,
                colors: true,
                breakLength: breaklines ? 1 : Infinity
            });

            console.log(`\n`);
            console.log(`\t${s}`);
        }

        if (lines.length) {
            console.log(`\n`);

            for (const l of lines) {
                console.log(`\t${l}`);
            }
        }
    }

    static logStateErr(msg, o, breaklines, ...lines) {
        const header = `[GAMESTATE ERROR]`;

        console.log('\n');
        console.count(`${header}`);
        console.error(`${msg}`);

        if (o) {
            const s = Util.inspect(o, {
                depth: 4,
                colors: true,
                breakLength: breaklines ? 1 : Infinity
            });

            console.log(`\n`);
            console.error(`\t${s}`);
        }

        if (lines.length) {
            console.log(`\n`);

            for (const l of lines) {
                console.error(`\t${l}`);
            }
        }
    }
}

module.exports = Game;