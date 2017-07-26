const TurnManager = require('./turnmanager');
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

        {
            console.log('-==-');
            console.log('game created');
            console.log('gameid: ' + this.id)
            console.log('players:');
            for (const p of this.players) {
                console.log('seat index:' + p[0]);
                console.log('occupant: ' + p[1]);
            }
            console.log('-==-');
        }

        this.turnManager = new TurnManager();

        this.playerWithAction = null;
        this.phase = null;





        this.lastAction = null;
        this.actionHistory = [];

        this.deck = new Deck();
        this.deck.shuffle(5);

        this.turnOrder = new Map();
        this.folded = new Set();

        this.bets = new Map();

        this.currentActionOnPlayer = 1;

        this.potsize = 0;
        this.minbet = 10;

        this.gameEvent = new GameEvent();

        this.gameEvent.once('game-start', (onstart) => {
            {
                console.log('===');
                console.log('game start!');
                console.log('register and notify all valid players ...');
                console.log('===');
            }

            for (let i = 0; i < this.playerCount; i++) {
                let j = (this.button + i) % this.playerCount;

                {
                    console.log('===');
                    console.log('re-ordered player:');
                    console.log(`${i} -> ${j}`);
                    console.log(players[j][0], players[j][1].player.id)
                    console.log('===');
                }

                this.turnManager.add(players[j][1].player.id, i);
            }

            let c = this.turnManager.start;

            while (c) {
                onstart(c.id);
                c = c.next;
            }

            this.turnManager.pretty();

            this.playerWithAction = this.turnManager.start.next;
            this.playerWithAction.phase = 'predeal';
            this.phase = 'predeal';

            {
                console.log('===');
                console.log('small blind: ');
                console.log(this.playerWithAction);
                console.log('===');
            }

            this.gameEvent.emit('predeal', this.playerWithAction.id, this.playerWithAction.order, ['ante'], this.minbet);
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
                console.log('===');
                console.log('bet action completed');
                console.log('playerid: ' + actingId);
                console.log('bet amount: ' + betAmount);
                console.log('===');
            }

            if (this.playerWithAction.next === null) { // note: means this is the last player to act aka the button
                {
                    Game.log('phase ended', `phase ${this.playerWithAction.phase}`);
                }

                if (this.playerWithAction.call || this.playerWithAction.ante) {
                    {
                        Game.log('last player called ...');
                    }

                    switch (this.playerWithAction.phase) {
                        case 'predeal':
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

                            this.gameEvent.emit('preflop', dealt);

                            break;
                        case 'preflop':
                            this.gameEvent.emit('postflop');
                            break;
                        case 'postflop':
                            this.gameEvent.emit('preriver');
                            break;
                        case 'preriver':
                            this.gameEvent.emit('postriver');
                            break;
                        case 'postriver':
                            this.gameEvent.emit('end');
                            break;
                        default:
                            {
                                console.log('===');
                                console.log('invalid game phase');
                                console.log('===');
                            }
                            break;
                    }
                } else if (this.playerWithAction.bet) {

                } else if (this.playerWithAction.raised) {

                } else {

                }

                // this.gameEvent.emit('notify-next-to-act', this)
            } else {
                let minbet = this.minbet;
                let allowed = [];

                switch (betType) {
                    case 'ante':
                        if (!this.playerWithAction.ante) {
                            this.playerWithAction.ante = true;
                            allowed.push('ante');
                        }
                        break;
                    case 'bet':
                        break;
                    case 'check':
                        break;
                    case 'raise':
                        break;
                    case 'fold':
                        break;
                    default:
                        break;
                }

                this.phase = this.playerWithAction.phase;
                this.playerWithAction = this.playerWithAction.next;
                this.playerWithAction.phase = this.phase;

                this.gameEvent.emit('notify-next-to-act', this.playerWithAction.id, this.playerWithAction.phase, this.playerWithAction.order, allowed, minbet);
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