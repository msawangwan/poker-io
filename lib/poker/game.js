const Table = require('./table');
const Deck = require('./deck');
const Card = require('./card');
const EventEmitter = require('events');

const gameActionType = {
    postblind: {
        big: 'post-big-blind',
        small: 'post-small-blind'
    },
    call: 'call',
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

    updatePlayerTurnOrder(index, playerid) {
        if (!playerid in this.players) {
            console.log('that player isnt in this game');
        } else {
            this.turnOrder.set(index, playerid);

            if (this.turnOrder.size >= this.players.length) {
                console.log('all players ready');
                // this.gameEvent.emit('post-blinds', this.turnOrder.get(1), this.turnOrder.get(2));
                this.currentActionOnPlayer = 1;
                this.gameEvent.emit('action', this.turnOrder.get(this.currentActionOnPlayer), gameActionType.postblind.small);
                this.currentActionOnPlayer = 2;
            }
        }
    }
}

module.exports = Game;