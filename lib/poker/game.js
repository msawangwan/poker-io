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
        // this.lead
        // this.activePlayer
        // this.matchthepot

        this.states = new Map([
            ['blind', { isOpen: true }],
            ['deal', { isOpen: true }],
            ['flop', { isOpen: true }],
            ['turn', { isOpen: true }],
            ['river', { isOpen: true }],
        ]);

        this.gameEvent.once('game-start', (onstart) => {
            this.deck.shuffle(5);

            this.player.initialise({
                positions: this.positions,
                dealerPositionIndex: this.buttonPosition
            });

            onstart(this.id);

            // const smallblind = this.player.byOrderIndex(0);

            const turn = this.startTurn(0, 5);
        });
    };

    startTurn(betOrderIndex, lastBetAmount) {
        const turnData = {
            actions: [],
            owes: lastBetAmount
        };

        const state = this.currentState;

        if (betOrderIndex === '0' || betOrderIndex === '1' && state === 'blind') {
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

        return turnData;
    }

    endTurn(pid, actionType, betAmount) {
        const player = this.player.byId(pid);

        if (actionType === 'fold') {
            player.hasFolded = true;
        } else {
            this.pot
        }
    }

    playerCompletedAction(id, stateName, action, orderIndex, amount) {
        Game.logPlayerAction(
            'client sent un-validated action with parameters', id, stateName, action, orderIndex, amount
        );

        const state = this.currentState;

        if (state.name != stateName) {
            console.log("PROBLEM WITH STATE SYNC");
        }

        const actingPlayer = this.player.inAction(orderIndex);

        console.log('acting player');
        console.log(actingPlayer);

        const complete = state.update(actingPlayer);

        let nextState = state;

        if (complete) {
            state.current = false;
            nextState = this.states.get(state.id + 1);
            nextState.current = true;
        }

        // const minBet = amount > this.pot.blind ? amount : this.pot.blind;

        const nextPlayer = this.player.nextInOrder(orderIndex, 0, false);

        console.log('next player');
        console.log(nextPlayer);

        const owes = Player.owes(nextPlayer, nextState.name, minBet);
        const turn = Dealer.passActionToNext(nextState, nextPlayer, owes);

        console.log(turn);

        // if (this.dealer.activePlayer.state.isAnchor) {
        //     switch (roundState.name) {
        //         case 'deal':
        //             this.gameEvent.emit(
        //                 'deal-holecards',
        //                 this.dealer.allValidPlayerStates,
        //                 this.dealHolecards()
        //             );

        //             break;
        //         case 'flop':
        //             this.gameEvent.emit(
        //                 'deal-flop',
        //                 this.blindBetSize,
        //                 this.dealFlop()
        //             );

        //             break;
        //         default:
        //             break;
        //     }
        // }

        this.gameEvent.emit('pass-action-to-player', nextState, nextPlayer, turn, this.pot);
    }

    playerNameLookupBySeat(i) {
        return this.positions.find(([k, v]) => k === i)[1].state.name;
    }

    dealHolecards() {
        this.currentRound = 'deal';

        const dealt = new Map();

        for (const p of this.positions) {
            dealt.set(p[1].state.id, {
                a: null, b: null
            });
        }

        for (const p of this.positions) {
            dealt.get(p[1].state.id).a = this.deck.draw();
        }

        for (const p of this.positions) {
            dealt.get(p[1].state.id).b = this.deck.draw();
        }

        return dealt;
    }

    dealFlop() {
        this.currentRound = 'flop';

        const flop = new Map();
        const burn = this.deck.draw();

        let i = 0;

        while (i < 3) {
            flop.set(i, this.deck.draw());
            i++;
        }

        return flop;
    }

    static log(...lines) {
        for (const line of lines) {
            console.log(line);
        }
        console.log('\n');
    };

    static logState(o, message) {
        console.log(`${message ? message : 'game: log object state'}`);
        console.log(o);
        console.log('\n');
    }

    static logRoundState(msg, rcur, rnext) {
        console.log('=== === === ===');
        console.log('**');
        console.log(`${msg}:`);
        console.log('**');
        console.log(`round current: ${rcur}`);
        console.log(`round next: ${rnext}`);
        console.log('**');
        console.log('=== === === ===');
        console.log('\n');
    }

    static logPlayerAction(msg, id, r, a, o, b) {
        console.log('=== === === ===');
        console.log('**');
        console.log(`${msg}:`);
        console.log('**');
        console.log(`player id: ${id}`)
        console.log(`game round: ${r}`)
        console.log(`action completed: ${a}`)
        console.log(`turn order position index: ${o}`)
        console.log(`bet action amount: ${b}`)
        console.log('**');
        console.log('=== === === ===');
        console.log('\n');
    }
}

module.exports = Game;