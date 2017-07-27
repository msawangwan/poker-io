// const TurnManager = require('./turnmanager');
const Action = require('./action');
const Turn = require('./turn');
const Table = require('./table');
const Deck = require('./deck');
const Card = require('./card');
const EventEmitter = require('events');


class GameEvent extends EventEmitter { }

class Game {
    constructor(id, players, button) {
        this.id = id;

        this.players = players;
        this.button = button;

        this.turnOrder = [];
        // this.turnManager = new TurnManager();

        // this.playerWithAction = null;

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
                Game.log('game start', 'registier and notify all players');
            }

            for (let i = 0; i < this.playerCount; i++) {
                let j = (this.button + i) % this.playerCount;

                {
                    Game.log('re-ordereding player', `${i} -> ${j}`, players[j][0], players[j][1].player.id);
                }

                // this.turnManager.add(players[j][1].player.id, i);
                let id = players[j][1].player.id;

                this.turnOrder[i] = id;

                onstart(id);
            }

            // let c = this.turnManager.start;

            // while (c) {
            //     onstart(c.id);
            //     c = c.next;
            // }

            // this.turnManager.pretty();

            // this.playerWithAction = this.turnManager.start.next;
            // this.playerWithAction.phase = 'predeal';

            {
                Game.log('small blind', this.turnOrder[0]);
                // Game.log('small blind', this.playerWithAction);
            }

            // this.gameEvent.emit('predeal', this.playerWithAction.id, this.playerWithAction.order, ['ante'], this.minbet);
            this.gameEvent.emit('predeal', this.turnOrder[0], 1, ['ante'], this.minbet);
        });

        /* bet types:
        *   - ante
        *   - bet
        *   - check
        *   - raise
        *   - fold
        */

        this.gameEvent.on('turn-action', (betType, betAmount, actingId, notifyAll) => {
            this.potsize += betAmount;

            {
                Game.log('bet action completed', `playerid ${actingId}`, `bet amount ${betAmount}`)
            }

            let minbet = this.minbet;
            let allowed = [];

            switch (betType) {
                case 'ante':
                    // this.playerWithAction.lastAction = 'ante';
                    allowed.push('ante');
                    break;
                case 'bet':
                    // this.playerWithAction.lastAction = 'bet';
                    allowed.push('call');
                    allowed.push('raise');
                    allowed.push('fold');
                    break;
                case 'check':
                    // this.playerWithAction.lastAction = 'check';
                    allowed.push('check');
                    allowed.push('bet');
                    allowed.push('fold');
                    break;
                case 'raise':
                    // this.playerWithAction.lastAction = 'raise';
                    allowed.push('call');
                    allowed.push('raise');
                    allowed.push('fold');
                    break;
                case 'fold':
                    // this.playerWithAction.lastAction = 'fold';
                    allowed.push('call');
                    break;
                default:
                    break;
            }

            // if (this.playerWithAction.next === null) {
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

                this.playerWithAction = this.turnManager.start;
            } else {
                // this.playerWithAction = this.playerWithAction.next;
                // this.playerWithAction.phase = this.playerWithAction.prev.phase;

                this.gameEvent.emit(
                    'notify-next-to-act',
                    this.turnOrder[0],
                    'predeal',
                    1,
                    // this.playerWithAction.id,
                    // this.playerWithAction.phase,
                    // this.playerWithAction.order,
                    allowed,
                    minbet
                );
            }

            notifyAll(actingId, betAmount, this.potsize);
        });
    };

    get playerCount() {
        return this.players.length;
    };

    get utg() {
        return this.turnManager.start.next.next.next;
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