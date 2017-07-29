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

        this.turns = new Map([
            ['blinds', new Turn('blinds')],
            ['predeal', new Turn('predeal')],
            ['preflop', new Turn('preflop')],
            ['postflop', new Turn('postflop')],
            ['preriver', new Turn('preriver')],
            ['postriver', new Turn('postriver')],
        ]);

        this.turnOrder = [];
        this.currentTurnOrder = 0;

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

        this.gameEvent.on('player-posted-blind', (playerid, type, bet, onnotify) => {
            const action = new Action(playerid, this.actingOrderById.get(playerid), type);

            onnotify(playerid, bet, this.potsize);

            this.actionPosition = (this.actionPosition + 1) % this.playerCount;

            if (this.rounds.get('blind').lastAction === null) {
                const bbId = this.actingOrderByPos.get(this.actionPosition);

                {
                    Game.log("WE STILL HAVE BB TO DO");
                }

                this.gameEvent.emit('collect-blind', bbId, 'bb', this.minbet);
            } else {
                const utgId = this.actingOrderByPos.get(this.actionPosition);

                {
                    Game.log("WE KOMLET THE BLINDS", "TODO NOTIFY NEXT UTG");
                }

                this.gameEvent.emit('deal-holecards', utgId, this.minbet, this.dealHolecards());
            }

            this.rounds.get('blind').act(action);
        });

        this.gameEvent.on('player-posted-bet', (playerid, round, type, bet, onnotify) => {
            this.rounds.get(round).act(new Action(playerid, this.actingOrderById.get(playerid), type));

            onnotify(playerid, bet, this.potsize);

            if (this.actionPosition === this.playerCount - 1) {
                {
                    Game.log("VON RUNSTEIN");
                }
            }

            {
                Game.log("CURRENT ACTION POSITION:", this.actionPosition);
            }

            this.actionPosition = (this.actionPosition + 1) % this.playerCount;

        });
    };

    get playerCount() {
        return this.positions.length;
    };

    get currentTurnOrderId() {
        return this.turnOrder[this.currentTurnOrder];
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