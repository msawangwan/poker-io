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

        this.deck = new Deck();
        this.deck.shuffle(5);

        this.turnOrder = new Map();
        this.folded = new Set();

        this.bets = {
            predeal: new Map(),
            preflop: new Map(),
            postflop: new Map(),
            preriver: new Map(),
            postriver: new Map()
        };

        this.firstToAct = null;
        this.currentActionOnPlayer = 1;

        this.potsize = 0;
        this.minbet = 10;

        this.gameEvent = new GameEvent();

        this.gameEvent.on('bet-placed', (betType, betPhase, betAmount, actingId, actingBalance, actingName, actingSeat, oncomplete) => {
            this.potsize += betAmount;

            let currentPhase = betPhase;
            let nextMinBet = this.minbet;
            let nextToActId = this.nextToAct;
            let nextBetAction = '';

            switch (betType) {
                case 'smallblind':
                    nextBetAction = 'bigblind';

                    {
                        console.log('===');
                        console.log('player posted small blind');
                        console.log(actingId);
                        console.log(betAmount);
                        console.log('===');
                    }

                    if (this.bets.predeal.has(actingId)) {
                        console.log(`err: ${actingId} already posted the small blind!`);
                    } else {
                        console.log('adding to bet history ...');
                    }

                    this.bets.predeal.set(actingId, betAmount);

                    break;
                case 'bigblind':
                    nextBetAction = 'anteup';

                    {
                        console.log('===');
                        console.log('player posted big blind');
                        console.log(actingId);
                        console.log(betAmount);
                        console.log('===');
                    }

                    {
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

                        this.gameEvent.emit('deal-holecards', dealt);
                    }

                    if (this.bets.predeal.has(actingId)) {
                        console.log(`err: ${actingId} already posted the big blind!`);
                    } else {
                        console.log('adding to bet history ...');
                    }

                    this.bets.predeal.set(actingId, betAmount);

                    break;
                case 'anteup':
                    nextBetAction = 'check';

                    {
                        console.log('==');
                        console.log('ante up called');
                        console.log(actingId);
                        console.log('==');
                    }

                    if (this.bets.preflop.has(actingId)) {
                        console.log(`err: ${actingId} already anted!`);
                    } else {
                        console.log('adding to bet history ...');
                    }

                    this.bets.preflop.set(actingId, betAmount);

                    break;
                case 'bet':
                    nextBetAction = 'callorraise';
                    break;
                case 'check':
                    nextBetAction = 'check';

                    this.bets.preflop.
                        break;
                case 'callorraise':
                    nextBetAction = '';
                    break;
                case 'raise':
                    break;
                case 'fold':
                    {
                        console.log('==');
                        console.log('player folded');
                        console.log(actingId);
                        console.log('==');
                    }

                    {
                        this.folded.add(id);
                    }

                    break;
                default:
                    {
                        console.log('===');
                        console.log('invalid bet type');
                        console.log('player: ' + actingId);
                        console.log('type: ' + betType);
                        console.log('===');
                    }
                    break;
            }

            this.gameEvent.emit('notify-next-action', nextToActId, nextBetAction, currentPhase, nextMinBet);

            this.passActionToNextPlayer();

            {
                console.log('===');
                console.log('bet log');
                console.log(this.bets);
                console.log('===');
            }

            oncomplete(betType, betPhase, betAmount, this.potsize, actingBalance, actingId, actingName, actingSeat);
        });
    };

    get playerCount() {
        return this.players.length;
    };

    get nextToAct() {
        do {
            let nextId = this.turnOrder.get(this.currentActionOnPlayer);

            if (!this.folded.has(nextId)) {
                {
                    console.log('===');
                    console.log(`${nextId} has next action ...`)
                    console.log('===');
                }

                return nextId;
            }

            {
                console.log('===');
                console.log(`${nextId} has folded this hand ...`)
                console.log('===');
            }

            this.passActionToNextPlayer();
        } while (true);
    }

    passActionToNextPlayer() {
        console.log('===');
        console.log('current player has action: ' + this.currentActionOnPlayer);

        this.currentActionOnPlayer += 1 % this.playerCount;
        this.currentActionOnPlayer %= this.playerCount;

        console.log('next player has action: ' + this.currentActionOnPlayer);
        console.log('===');
    };

    updatePlayerTurnOrder(index, playerid) {
        if (!playerid in this.players) {
            console.log('that player isnt in this game');
        } else {
            this.turnOrder.set(index, playerid);

            if (this.turnOrder.size >= this.players.length) {
                this.currentActionOnPlayer = 1;

                {
                    console.log('===');
                    console.log('all players assigned a turn order');
                    console.log('===');
                }

                this.firstToAct = this.nextToAct;

                this.gameEvent.emit('notify-next-action', this.firstToAct, 'smallblind', 'predeal', this.minbet);
                this.passActionToNextPlayer();
            }
        }
    };
}

module.exports = Game;