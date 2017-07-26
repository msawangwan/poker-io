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
                console.log(p[0], p[1]);
                console.log(p[1].player);
            }
            console.log('-==-');
        }

        this.turnManager = new TurnManager();
        
        this.playerWithAction = null;
        this.actionHistory = [];
        
        
        
        this.turns = null;

        this.deck = new Deck();
        this.deck.shuffle(5);

        this.turnOrder = new Map();
        this.folded = new Set();

        this.bets = new Map();

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
                console.log(p[0], p[1].player.id);
                this.turnManager.add(p[1].player.id);
            }

            let c = this.turnManager.start;

            while (c) {
                onstart(c.id);
                c = c.next;
            }

            this.turnManager.pretty();
            this.playerWithAction = this.turnManager.start;

            // this.turnManager.start.next.predeal = true;
            // this.gameEvent.emit('predeal', this.turnManager.start.next.id);
            
            this.gameEvent.emit('predeal', this.playerWithAction.id);
        });
        
        /* bet types:
        *   - ante
        *   - bet
        *   - check
        *   - raise
        *   - fold
        */

        this.gameEvent.on('bet-action-complete', (betType, nextBetType, betPhase, betAmount, actingId, actingBalance, actingName, actingSeat, oncomplete) => {
            this.potsize += betAmount;

            {
                console.log('===');
                console.log('bet action completed');
                console.log(actingName);
                console.log(actingId);
                console.log(betAmount);
                console.log('===');
            }

            let currentPhase = betPhase;
            let nextMinBet = this.minbet;
            let nextToActId = this.nextToAct;
            let nextBetAction = nextBetType;
            
            if (this.playerWithAction.next === null) { // note: means this is the last player to act aka the button
                let first = this.turnManager.start;
                
                while (first.fold) {
                    first = first.next;
                    if (first === null) {
                        this.gameEvent.emit('end'); // TODO: all players folded, game over
                        break;
                    }
                }
                
                if (turn.call) {
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
    
                            // this.gameEvent.emit('deal-holecards', dealt);
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
                } else if(turn.bet) {
                    
                } else if (turn.raised) {
                    
                } else {
                    
                }
            }

            switch (betType) {
                case 'smallblind':
                    if (!turn.call) {
                        turn.call = true;
                    }
                    break;
                case 'bigblind':
                    if (!turn.call) {
                        turn.call = true;
                    }
                    break;
                case 'anteup':
                    if (!turn.call) {
                        turn.call = true;
                    }
                    break;
                case 'check':
                    if (!turn.check) {
                        turn.check = true;
                    }
                    break;
                case 'bet':
                    if (!turn.bet) {
                        turn.bet = true;
                    }
                    break;
                case 'raise':
                    if (!turn.raise) {
                        turn.raise = true;
                    }
                    break;
                case 'fold':
                    if (!turn.fold) {
                        turn.fold = true;
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