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
            this.phase = 'predeal';

            {
                console.log('===');
                console.log('small blind: ');
                console.log(this.playerWithAction);
                console.log('===');
            }

            this.gameEvent.emit('predeal', this.playerWithAction.id, this.playerWithAction.order, this.phase, this.minbet);
        });

        /* bet types:
        *   - ante
        *   - bet
        *   - check
        *   - raise
        *   - fold
        */

        this.gameEvent.on('turn-action', (betType, nextBetType, betPhase, betAmount, actingId, actingBalance, actingName, actingSeat, notifyAll) => {
            this.potsize += betAmount;

            {
                console.log('===');
                console.log('bet action completed');
                console.log('player name: ' + actingName);
                console.log('playerid: ' + actingId);
                console.log('bet amount: ' + betAmount);
                console.log('===');
            }

            if (this.playerWithAction.next === null) { // note: means this is the last player to act aka the button
                let first = this.turnManager.start;

                while (first.fold) {
                    first = first.next;
                    if (first === null) {
                        this.gameEvent.emit('end'); // TODO: all players folded, game over
                        break;
                    }
                }

                if (this.playerWithAction.call) {
                    switch (currentPhase) {
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
            }

            switch (betType) {
                case 'ante':
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


            {
                console.log('===');
                console.log('bet log');
                console.log(this.bets);
                console.log('===');
            }

            notifyAll(actingName, actingId, actingBalance, betAmount, this.potsize);
        });
    };

    get playerCount() {
        return this.players.length;
    };

    // get nextToAct() {
    //     do {
    //         let nextId = this.turnOrder.get(this.currentActionOnPlayer);

    //         if (!this.folded.has(nextId)) {
    //             {
    //                 console.log('===');
    //                 console.log(`${nextId} has next action ...`)
    //                 console.log('===');
    //             }

    //             return nextId;
    //         }

    //         {
    //             console.log('===');
    //             console.log(`${nextId} has folded this hand ...`)
    //             console.log('===');
    //         }

    //         // this.passActionToNextPlayer();
    //     } while (true);
    // }

    // passActionToNextPlayer() {
    //     console.log('===');
    //     console.log('current player has action: ' + this.currentActionOnPlayer);

    //     this.currentActionOnPlayer += 1 % this.playerCount;
    //     this.currentActionOnPlayer %= this.playerCount;

    //     console.log('next player has action: ' + this.currentActionOnPlayer);
    //     console.log('===');
    // };
}

module.exports = Game;