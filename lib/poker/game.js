const Table = require('./table');
const Deck = require('./deck');
const Card = require('./card');
const EventEmitter = require('events');

const gameActionType = {
    post: {
        smallblind: 'post-small-blind',
        bigblind: 'post-big-blind',
        ante: 'post-ante-up'
    },
    call: {
        blind: 'call-blind',
        check: 'check-blind',
        raise: 'raise-blind'
    },
    raise: 'raise',
    bet: 'bet',
    check: 'check'
};

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

        this.currentActionOnPlayer = 1;

        this.potsize = 0;
        this.minbet = 10;

        this.gameEvent = new GameEvent();

        this.gameEvent.once('posted-small-blind', (id, amount, onpost) => {
            this.potsize += amount;

            this.gameEvent.emit('action', this.turnOrder.get(this.currentActionOnPlayer), gameActionType.post.bigblind, this.minbet);
            this.nextToAct();

            {
                console.log('===');
                console.log('player posted small blind');
                console.log(id);
                console.log(amount);
                console.log('===');
            }

            //todo: get ride of this, we dont need it as its in onpost
            // this.gameEvent.emit('update-potsize', this.potsize);

            onpost(this.potsize);
        });

        this.gameEvent.once('posted-big-blind', (id, amount, onpost) => {
            this.potsize += amount;

            this.gameEvent.emit('action', this.turnOrder.get(this.currentActionOnPlayer), gameActionType.post.ante, this.minbet);
            this.nextToAct();

            {
                console.log('===');
                console.log('player posted big blind');
                console.log(id);
                console.log(amount);
                console.log('===');
            }

            // deprecated
            // this.gameEvent.emit('update-potsize', this.potsize);

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

            onpost(this.potsize);
        });

        this.gameEvent.on('ante-up-call', (id, amount, oncall) => {
            console.log('ante up called');
            oncall(this.potsize);
        });

        this.gameEvent.on('ante-up-raised', (id, amount, onraise) => {
            console.log('ante raised');
            onraise(this.potsize);
        });

        this.gameEvent.on('ante-fold', (id, amount, onfold) => {
            console.log('ante folded');
            this.folded.add(id);
            onfold(this.potsize);
        });
    };

    get playerCount() {
        return this.players.length;
    };

    nextToAct() {
        console.log('current player to act is (before): ' + this.currentActionOnPlayer);
        this.currentActionOnPlayer += 1 % this.playerCount;
        this.currentActionOnPlayer %= this.playerCount;
        console.log('current player to act is (after): ' + this.currentActionOnPlayer);
    };

    updatePlayerTurnOrder(index, playerid) {
        if (!playerid in this.players) {
            console.log('that player isnt in this game');
        } else {
            this.turnOrder.set(index, playerid);

            if (this.turnOrder.size >= this.players.length) {
                console.log('all players ready');
                this.currentActionOnPlayer = 1;
                this.gameEvent.emit('action', this.turnOrder.get(this.currentActionOnPlayer), gameActionType.post.smallblind, this.minbet);
                this.nextToAct();
            }
        }
    };
}

module.exports = Game;