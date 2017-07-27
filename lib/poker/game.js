// const TurnManager = require('./turnmanager');
const Action = require('./action');
const Turn = require('./turn');
const Table = require('./table');
const Deck = require('./deck');
const Card = require('./card');
const EventEmitter = require('events');


class GameEvent extends EventEmitter { }

class Game {
    constructor(id, positions, button) {
        this.id = id;

        this.positions = positions;
        this.button = button;

        this.turns = new Map();
        // this.order = new Map();
        this.turnOrder = [];
        this.currentTurnOrder = 1;

        this.deck = new Deck();
        this.deck.shuffle(5);

        this.potsize = 0;
        this.minbet = 10;

        {
            Game.log('game created:', `game id: ${this.id}`);
        }

        this.gameEvent = new GameEvent();

        this.gameEvent.once('game-start', (onstart) => {
            {
                Game.log('game start', 'register and notify all players');
            }

            let sb = -1;

            for (let i = 0; i < this.playerCount; i++) {
                let j = (this.button + i) % this.playerCount;

                {
                    Game.log('re-ordereding player', `${i} -> ${j}`, this.positions[j][0], this.positions[j][1].player.id);
                }

                let id = this.positions[j][1].player.id;

                if (sb === -1) {
                    sb = id;
                }

                this.turnOrder[i] = id;
                // this.order.set(id, i);

                onstart(id);
            }

            this.turns.set('predeal', new Turn('predeal'));

            {
                Game.log('small blind', this.turnOrder[this.currentTurnOrder]);
                // Game.log('small blind', this.order.get(sb));
            }

            this.gameEvent.emit('predeal', this.turnOrder[this.currentTurnOrder], ['smallblind'], this.minbet);
            // this.gameEvent.emit('predeal', this.order.get(sb), ['smallblind'], this.minbet);
        });

        /* bet types:
        *   - ante
        *   - bet
        *   - check
        *   - raise
        *   - fold
        */

        this.gameEvent.on('turn-action', (betType, betAmount, turnPhase, actingId, notifyAll) => {
            this.potsize += betAmount;

            {
                Game.log('bet action completed', `playerid ${actingId}`, `bet amount ${betAmount}`, `${turnPhase}`)
            }

            let minbet = this.minbet;
            let allowed = [];

            if (!this.turns.has(turnPhase)) {
                this.turns.set(turnPhase, new Turn(turnPhase));
            }

            const t = this.turns.get(turnPhase);
            const a = new Action(actingId, betType);

            for (const r of a.allowedResponseActions) {
                allowed.push(r);
            }

            t.completeAction(a);

            this.currentTurnOrder = (this.currentTurnOrder + 1) % this.playerCount;

            {
                Game.log('next to act:', `index: ${this.currentTurnOrder}`, `id: ${this.nextInTurnOrder}`)
            }

            if (false) {
                switch (this.playerWithAction.prev.lastAction) {
                    case 'ante':
                        const dealt = new Map();

                        for (const p of this.players) {
                            dealt.set(p[1].player.id, {
                                a: null, b: null
                            });
                        }

                        for (const p of this.players) {
                            dealt.get(p[1].player.id).a = this.deck.draw();
                        }

                        for (const p of this.players) {
                            dealt.get(p[1].player.id).b = this.deck.draw();
                        }

                        allowed.push('bet', 'check');

                        this.gameEvent.emit('preflop', dealt, this.playerWithAction.prev.id, this.playerWithAction.prev.order, allowed, minbet);

                        this.playerWithAction.lastAction = 'check';

                        break;
                    case 'bet':
                        break;
                    case 'check':
                        break;
                    case 'raise':
                        break;
                    case ' fold':
                        break;
                    default:
                        break;
                }

                {
                    Game.log('phase ended', `phase ${this.playerWithAction.phase}`);
                }

                // this.playerWithAction = this.turnManager.start;
            } else {
                this.gameEvent.emit(
                    'notify-next-to-act',
                    this.nextInTurnOrder,
                    'predeal',
                    allowed,
                    minbet
                );
            }

            {
                Game.log('output turn chain');
                t.printChain();
                Game.log('turn chain');
            }

            notifyAll(actingId, betAmount, this.potsize);
        });
    };

    get playerCount() {
        return this.positions.length;
    };

    get nextInTurnOrder() {
        return this.turnOrder[this.currentTurnOrder];
    };

    static log(...lines) {
        console.log('===');
        for (const line of lines) {
            console.log(line);
        }
        console.log('===');
    };
}

module.exports = Game;