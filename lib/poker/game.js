const Action = require('./action');
const Round = require('./round');
const Turn = require('./turn');
const Table = require('./table');
const Deck = require('./deck');
const Card = require('./card');
const EventEmitter = require('events');


class GameEvent extends EventEmitter { }

class Game {
    constructor(id, positions, buttonPosition) {
        this.id = id;

        this.positions = positions;
        this.buttonPosition = buttonPosition;
        this.actionPosition = 0;

        this.actingOrderById = new Map();
        this.actingOrderByPos = new Map();

        this.rounds = new Map([
            ['blind', new Round('blind')],
            ['deal', new Round('deal')],
            ['flop', new Round('flop')],
            ['turn', new Round('turn')],
            ['river', new Round('river')],
        ]);

        this.deck = new Deck();
        this.deck.shuffle(5);

        this.potsize = 0;
        this.minbet = 10;

        {
            Game.log('game created:', `game id: ${this.id}`, `button: ${this.buttonPosition}`);
        }

        this.gameEvent = new GameEvent();

        this.gameEvent.once('game-start', (onstart) => {
            {
                Game.log('game start', '- register turn order', '- notify seated players');
            }

            for (let i = 0; i < this.playerCount; i++) {
                let j = this.playerPositionRelativeToButtonPosition(i)
                let id = this.positions[i][1].player.id;

                {
                    Game.log(`re-ordereding player position ${i} -> ${j}`, `seat at relative position ${this.positions[j][0]}`, `id ${id}`);
                }

                this.actingOrderById.set(id, j);
                this.actingOrderByPos.set(j, id);

                onstart(id);
            }

            const sbId = this.actingOrderByPos.get(this.actionPosition);

            {
                Game.log('small blind player id:', sbId);
            }

            this.gameEvent.emit('collect-blind', sbId, 'sb', this.minbet);
        });

        this.gameEvent.on('player-posted-blind', (playerid, actionType, bet, onnotify) => {
            this.potsize += bet;

            const action = new Action(playerid, this.actingOrderById.get(playerid), actionType);

            action.bet = bet;

            onnotify(playerid, bet, this.potsize);

            this.actionPosition = (this.actionPosition + 1) % this.playerCount;

            if (this.rounds.get('blind').lastAction === null) {
                const bbId = this.actingOrderByPos.get(this.actionPosition);

                {
                    Game.log("player posted small blind", "waiting for big blind");
                }

                this.gameEvent.emit('collect-blind', bbId, 'bb', this.minbet);
            } else {
                const utgId = this.actingOrderByPos.get(this.actionPosition);

                {
                    Game.log('player posted big blind', 'dealing holecards');
                }

                this.gameEvent.emit('deal-holecards', utgId, this.minbet, this.dealHolecards());
            }

            this.rounds.get('blind').act(action);
        });

        this.gameEvent.on('player-posted-ante', (playerid, actionType, bet, onnotify) => {
            this.potsize += bet;

            const action = new Action(playerid, this.actingOrderById.get(playerid), actionType);

            onnotify(playerid, bet, this.potsize);

            if ((this.actionPosition === this.playerCount - 1) && (actionType !== 'raise')) {
                this.gameEvent.emit('collect-flop', 0, 'open', this.minbet);
            } else {
                this.actionPosition = (this.actionPosition + 1) % this.playerCount;

                const nextToActId = this.actingOrderByPos.get(this.actionPosition);

                if (action.type === 'raise') {
                    {
                        Game.log('player raised ante');
                    }
                    this.gameEvent.emit('player-sent-raise', nextToActId, bet); // todo: register on the table side
                } else {
                    {
                        Game.log('player called ante');
                    }
                    this.gameEvent.emit('player-sent-call', nextToActId, bet); // todo: register on table side
                }
            }

            this.rounds.get('deal').act(action);
        });

        // this.gameEvent.on('player-posted-bet', (playerid, round, type, bet, onnotify) => {
        //     this.potsize += bet;

        //     const action = new Action(playerid, this.actingOrderById.get(playerid), type);

        //     action.bet = bet;

        //     onnotify(playerid, bet, this.potsize);

        //     // this.actionPosition = (this.actionPosition + 1) % this.playerCount;

        //     if (this.actionPosition === this.playerCount - 1) { // on the button
        //         const last = this.rounds.get(round).lastAction;

        //         if (last) {
        //             if (last.type === 'check' || last.type === 'fold') {
        //                 Game.log('you are last to act and can either bet or check or fold  yourself');
        //             } else if (last.type === 'raise') {
        //                 Game.log('you just got RAISED');
        //             }
        //         } else {
        //             Game.log('no last action', `${last}`);
        //             this.gameEvent.emit('player-has-open-action');
        //         }
        //     }

        //     this.rounds.get(round).act(action);

        //     this.actionPosition = (this.actionPosition + 1) % this.playerCount;
        // });
    };

    get playerCount() {
        return this.positions.length;
    };

    playerPositionRelativeToButtonPosition(i) {
        return (this.buttonPosition + i) % this.playerCount;
    }

    dealHolecards() {
        const dealt = new Map();

        for (const p of this.positions) {
            dealt.set(p[1].player.id, {
                a: null, b: null
            });
        }

        for (const p of this.positions) {
            dealt.get(p[1].player.id).a = this.deck.draw();
        }

        for (const p of this.positions) {
            dealt.get(p[1].player.id).b = this.deck.draw();
        }

        return dealt;
    }

    static log(...lines) {
        console.log('===');
        for (const line of lines) {
            console.log(line);
        }
        console.log('===');
    };
}

module.exports = Game;