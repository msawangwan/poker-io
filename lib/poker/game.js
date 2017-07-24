const Table = require('./table');
const Deck = require('./deck');
const Card = require('./card');
const EventEmitter = require('events');

const gameActionType = {
    postblind: {
        small: 'post-small-blind',
        big: 'post-big-blind'
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

        this.currentActionOnPlayer = 1;

        this.potsize = 0;
        this.minbet = 10;

        this.blinds = {
            big: this.minbet,
            small: this.minbet / 2
        };

        this.gameEvent = new GameEvent();

        this.gameEvent.once('posted-small-blind', (amount, id, onpost) => {
            console.log('player posted small blind');
            console.log(id);
            console.log(amount);
            this.gameEvent.emit('action', this.turnOrder.get(this.currentActionOnPlayer), gameActionType.postblind.big);
            this.nextToAct();

            onpost(null, null);
        });

        this.gameEvent.once('posted-big-blind', (amount, id, onpost) => {
            console.log('player posted big blind');
            console.log(id);
            console.log(amount);
            this.gameEvent.emit('action', this.turnOrder.get(this.currentActionOnPlayer), gameActionType.postblind.big);
            this.nextToAct();

            onpost(null, null);
        });

        this.gameEvent.once('deal', () => {

        });

        this.gameEvent.on('check', () => {

        });

        this.gameEvent.on('fold', () => {

        });

        this.gameEvent.on('raise', () => {

        });

        this.gameEvent.on('bet', () => {

        });
    };

    get playerCount() {
        return this.players.length;
    }

    nextToAct() {
        console.log('current player to act is (before): ' + this.currentActionOnPlayer);
        // this.currentActionOnPlayer += (1 % this.playerCount) % this.playerCount;
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
                this.gameEvent.emit('action', this.turnOrder.get(this.currentActionOnPlayer), gameActionType.postblind.small);
                this.nextToAct();
            }
        }
    }
}

module.exports = Game;