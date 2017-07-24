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

        this.deck = new Deck();
        this.deck.shuffle(5);

        this.potsize = 0;
        this.minbet = 10;

        this.blinds = {
            big: this.minbet,
            small: this.minbet / 2
        };

        this.gameEvent = new GameEvent();

        this.gameEvent.on('post-blinds', (playerid, blind, onposted) => {

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
}

module.exports = Game;