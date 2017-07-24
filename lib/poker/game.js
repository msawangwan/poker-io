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
        this.smallblind = button + 1 % this.players.length;
        this.bigblind = button + 2 % this.players.length;

        {
            console.log('===');
            console.log('new game positions:')
            console.log('button: ' + this.button);
            console.log('sb: ' + this.smallblind);
            console.log('bb: ' + this.bigblind);
            console.log('===');
        }

        this.round = {
            button: this.players[this.button],
            sb: this.players[this.smallblind],
            bb: this.players[this.bigblind]
        };

        {
            console.log('===');
            console.log('round positions');
            console.log('on the button:');
            console.log(this.round.button[1].player);
            console.log('sb:');
            console.log(this.round.sb[1].player);
            console.log('bb:');
            console.log(this.round.bb[1].player);
            console.log('===');
        }

        this.deck = new Deck();
        this.deck.shuffle(5);

        this.playerCount = () => this.players.size;
        this.onTheButton = this.playerCount() - 1;

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
}

module.exports = Game;