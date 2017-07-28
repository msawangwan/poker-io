const Action = require('./action');
const Turn = require('./turn');
const Table = require('./table');
const Deck = require('./deck');
const Card = require('./card');
const EventEmitter = require('events');


class GameEvent extends EventEmitter { }

class Game {
    constructor(id, positions, button) {
        this.id = id;

        this.positions = positions;
        this.button = button;

        this.turns = new Map([
            ['predeal', new Turn('predeal')],
            ['preflop', new Turn('preflop')],
            ['postflop', new Turn('postflop')],
            ['preriver', new Turn('preriver')],
            ['postriver', new Turn('postriver')],
        ]);

        this.turnOrder = [];
        this.currentTurnOrder = 1;

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
                Game.log('game start', 'register and notify all players');
            }

            let sb = -1;

            for (let i = 0; i < this.playerCount; i++) {
                let j = (this.button + i) % this.playerCount;

                {
                    Game.log('re-ordereding player', `${i} -> ${j}`, this.positions[j][0], this.positions[j][1].player.id);
                }

                let id = this.positions[j][1].player.id;

                if (sb === -1) {
                    sb = id;
                }

                this.turnOrder[i] = id;

                onstart(id);
            }

            {
                Game.log('small blind', this.currentTurnOrderId);
            }

            this.gameEvent.emit('predeal', this.currentTurnOrderId, ['smallblind'], this.minbet);
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

            // this.currentTurnOrder = (this.currentTurnOrder + 1) % this.playerCount;

            // {
            //     Game.log('next to act:', `index: ${this.currentTurnOrder}`, `id: ${this.currentTurnOrderId}`);
            // }

            // {
            //     Game.log('output turn chain');
            //     t.printChain();
            //     Game.log('---');
            // }

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

    static log(...lines) {
        console.log('===');
        for (const line of lines) {
            console.log(line);
        }
        console.log('===');
    };
}

module.exports = Game;