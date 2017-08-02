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

        Game.log('game created:', `game id: ${this.id}`, `button: ${this.buttonPosition}`);

        Game.log('seating order');
        for (const p of this.positions) {
            Game.log(p[0], p[1].player.id);
        }

        this.gameEvent = new GameEvent();

        this.gameEvent.once('game-start', (onstart) => {
            Game.log('game start', '- register turn order', '- notify seated players');

            for (let i = 0; i < this.playerCount; i++) {
                let j = this.playerPositionRelativeToButtonPosition(i)
                let id = this.positions[i][1].player.id;

                Game.log(`re-ordereding player position ${i} -> ${j}`, `seat at relative position ${this.positions[j][0]}`, `id ${id}`);

                this.actingOrderById.set(id, j);
                this.actingOrderByPos.set(i, id);

                onstart(id, this.id);
            }

            this.actionPosition = (this.buttonPosition + 1) % this.playerCount;

            const sbId = this.actingOrderByPos.get(this.actionPosition);

            Game.log('small blind player id:', sbId);

            this.gameEvent.emit('collect-blind', sbId, 'sb', this.minbet);
        });

        this.gameEvent.on('player-posted-blind', (playerid, actionType, bet, onnotify) => {
            this.potsize += bet;

            const action = new Action(playerid, this.actingOrderById.get(playerid), actionType);
            action.bet = bet;

            this.actionPosition = (this.actionPosition + 1) % this.playerCount;

            let clearTable = false;

            if (this.rounds.get('blind').lastAction === null) {
                const bbId = this.actingOrderByPos.get(this.actionPosition);

                Game.log("player posted small blind", `${playerid}`, "waiting for big blind");

                this.gameEvent.emit('collect-blind', bbId, 'bb', this.minbet);
            } else {
                const utgId = this.actingOrderByPos.get(this.actionPosition);

                Game.log('player posted big blind', 'dealing holecards');

                this.gameEvent.emit('deal-holecards', utgId, this.minbet, this.dealHolecards());
            }

            onnotify(playerid, bet, this.potsize, clearTable);

            this.rounds.get('blind').act(action);
        });

        this.gameEvent.on('player-posted-ante', (playerid, actionType, bet, onnotify) => {
            this.potsize += bet;

            const action = new Action(playerid, this.actingOrderById.get(playerid), actionType);

            let clearTable = false;

            if ((this.actionPosition === this.playerCount - 1) && (actionType !== 'raise')) {

                Game.log('all antes collected, we can now go to the flop');

                this.gameEvent.emit('deal-flop', 0, this.minbet, this.dealFlop());

                clearTable = true;
            } else {
                this.actionPosition = (this.actionPosition + 1) % this.playerCount;

                const nextToActId = this.actingOrderByPos.get(this.actionPosition);

                if (action.type === 'raise') {

                    Game.log('player raised ante');


                    this.gameEvent.emit('collect-ante', nextToActId, 'raise', bet);
                } else {

                    Game.log('player called ante');


                    this.gameEvent.emit('collect-ante', nextToActId, 'call', bet);
                }
            }

            onnotify(playerid, bet, this.potsize, clearTable);

            this.rounds.get('deal').act(action);
        });
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

    dealFlop() {
        const flop = new Map();
        const burn = this.deck.draw();

        {
            Game.log('dealing the flop', `burn card: ${burn}`);
        }

        let i = 0;

        while (i < 3) {
            flop.set(i, this.deck.draw());
            i++;
        }

        return flop;
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