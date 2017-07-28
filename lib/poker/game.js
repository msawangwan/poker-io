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

            // this.gameEvent.emit('collect-small-blind', sbId, this.minbet, this.potsize);
            this.gameEvent.emit('collect-blind', sbId, 'sb', this.minbet);
        });

        // this.gameEvent.once('player-posted-small-blind', (playerid, bet, onnotify) => {
        //     this.rounds.get('blind').act(new Action(playerid, this.actingOrderById.get(playerid), 'smallblind'));
        //     this.actionPosition = (this.actionPosition + 1) % this.playerCount;

        //     onnotify(playerid, bet, this.potsize);

        //     const bbId = this.actingOrderByPos.get(this.actionPosition);

        //     this.gameEvent.emit('collect-big-blind', bbId, this.minbet, this.potsize);
        // });

        this.gameEvent.once('player-posted-blind', (playerid, type, bet, onnotify) => {
            this.rounds.get('blind').act(new Action(playerid, this.actingOrderById.get(playerid), type));

            onnotify(playerid, bet, this.potsize);

            this.actionPosition = (this.actionPosition + 1) % this.playerCount;

            if (this.rounds.get('blind').lastAction.type === 'sb') {
                const bbId = this.actingOrderByPos.get(this.actionPosition);
                this.gameEvent.emit('collect-blind', bbId, 'bb', this.minbet);
                Game.log("WE STILL HAVE BB TO DO");
            } else {
                Game.log("WE KOMLET THE BLINDS", "TODO NOTIFY NEXT UTG");
            }
        });

        this.gameEvent.on('turn-action', (betType, betAmount, turnPhase, actingId, notifyAll) => {
            this.potsize += betAmount;

            {
                Game.log('bet action completed', `playerid ${actingId}`, `bet amount ${betAmount}`, `${turnPhase}`)
            }

            let minbet = this.minbet;

            const t = this.turns.get(turnPhase);
            let a = new Action(actingId, this.currentTurnOrder, betType);

            const nextPhase = t.completeAction(a, turnPhase);

            if (nextPhase !== turnPhase) {
                a = new Action(actingId, this.currentTurnOrder, 'check');
            }

            this.currentTurnOrder = (this.currentTurnOrder + 1) % this.playerCount;

            {
                // Game.log('next to act:', `index: ${this.currentTurnOrder}`, `id: ${this.currentTurnOrderId}`);
                Game.log('next to act:', `index: ${this.actionOrder.get(actingId)}`, `id: ${actingId}`);
            }

            {
                Game.log('output turn chain');
                t.printChain();
                Game.log('---');
            }

            notifyAll(actingId, betAmount, this.potsize);
            //   const dealt = new Map();

            //                 for (const p of this.players) {
            //                     dealt.set(p[1].player.id, {
            //                         a: null, b: null
            //                     });
            //                 }

            //                 for (const p of this.players) {
            //                     dealt.get(p[1].player.id).a = this.deck.draw();
            //                 }

            //                 for (const p of this.players) {
            //                     dealt.get(p[1].player.id).b = this.deck.draw();
            //                 }

            //                 allowed.push('bet', 'check');

            //                 this.gameEvent.emit('preflop', dealt, this.playerWithAction.prev.id, this.playerWithAction.prev.order, allowed, minbet);

            //                 this.playerWithAction.lastAction = 'check';

            this.currentTurnOrder = (this.currentTurnOrder + 1) % this.playerCount;

            {
                Game.log('next to act:', `index: ${this.currentTurnOrder}`, `id: ${this.currentTurnOrderId}`);
            }

            {
                Game.log('output turn chain');
                t.printChain();
                Game.log('---');
            }
            this.gameEvent.emit(
                'notify-next-to-act',
                this.currentTurnOrderId,
                nextPhase,
                a.allowedResponseActions,
                minbet
            );
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

    static log(...lines) {
        console.log('===');
        for (const line of lines) {
            console.log(line);
        }
        console.log('===');
    };
}

module.exports = Game;