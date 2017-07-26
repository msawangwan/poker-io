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
            console.log('a new game was started');
            console.log('with players:');
            console.log(players);
            console.log('-==-');
        }

        this.deck = new Deck();
        this.deck.shuffle(5);

        this.turnOrder = new Map();
        this.folded = new Set();

        this.bets = new Map();

        this.turnManager = new TurnManager();

        this.firstToAct = null;
        this.currentActionOnPlayer = 1;

        this.potsize = 0;
        this.minbet = 10;

        this.gameEvent = new GameEvent();

        this.gameEvent.once('game-start', (onstart) => {
            {
                console.log('===');
                console.log('game started');
                console.log('===');
            }

            for (const p of this.players) {
                this.turnManager.add(p[1].player.id);
            }

            this.turnManager.pretty();

            onstart();
        });

        this.gameEvent.on('bet-placed', (betType, nextBetType, betPhase, betAmount, actingId, actingBalance, actingName, actingSeat, oncomplete) => {
            this.potsize += betAmount;

            {
                console.log('===');
                console.log('bet placed');
                console.log(actingName);
                console.log(actingId);
                console.log(betAmount);
                console.log('===');
            }

            let currentPhase = betPhase;
            let nextMinBet = this.minbet;
            let nextToActId = this.nextToAct;
            let nextBetAction = nextBetType;

            if (!this.bets.has(currentPhase)) {
                this.bets.set(currentPhase, new Map());
            }

            const phaseHistory = this.bets.get(currentPhase);

            switch (betType) {
                case 'smallblind':
                    break;
                case 'bigblind':
                    {
                        // currentPhase = 'preflop';

                        // const dealt = new Map();

                        // for (const p of this.players) {
                        //     dealt.set(p[1].player.id, {
                        //         a: null, b: null
                        //     });
                        // }

                        // for (const p of this.players) {
                        //     dealt.get(p[1].player.id).a = this.deck.draw();
                        // }

                        // for (const p of this.players) {
                        //     dealt.get(p[1].player.id).b = this.deck.draw();
                        // }

                        // this.gameEvent.emit('deal-holecards', dealt);
                    }

                    // this.gameEvent.emit('phase-change', predeal, preflop, () => {
                    //     const dealt = new Map();

                    //     for (const p of this.players) {
                    //         dealt.set(p[1].player.id, {
                    //             a: null, b: null
                    //         });
                    //     }

                    //     for (const p of this.players) {
                    //         dealt.get(p[1].player.id).a = this.deck.draw();
                    //     }

                    //     for (const p of this.players) {
                    //         dealt.get(p[1].player.id).b = this.deck.draw();
                    //     }

                    //     this.gameEvent.emit('deal-holecards', dealt);
                    // });

                    break;
                case 'anteup':
                    if (actingId === this.firstToAct) {
                        console.log("FIRST TO ACT");
                        console.log("FIRST TO ACT");
                        console.log("FIRST TO ACT");
                        console.log("FIRST TO ACT");
                    }
                    break;
                case 'check':
                    break;
                case 'bet':
                    break;
                case 'raise':
                    break;
                case 'fold':
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

            oncomplete(betType, nextBetAction, currentPhase, betAmount, this.potsize, actingBalance, actingId, actingName, actingSeat);
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

                // this.gameEvent.emit('phase-change', 'pregame', 'predeal');
                this.firstToAct = this.nextToAct;

                this.gameEvent.emit('notify-next-action', this.firstToAct, 'smallblind', 'predeal', this.minbet);
                this.passActionToNextPlayer();
            }
        }
    };
}

module.exports = Game;