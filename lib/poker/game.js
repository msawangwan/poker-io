const Table = require('./table');
const Deck = require('./deck');
const Card = require('./card');
const EventEmitter = require('events');

class GameEvent extends EventEmitter { }

class Game {
    constructor(id, players, button) {
        this.id = id;

        this.players = players; // [p1, p2, p3, p4]

        this.button = button;
        this.smallblind = button + 1 % this.players.length;
        this.bigblind = button + 2 % this.players.length;

        this.bettingOrder = new Map([
            [0, this.players[this.smallblind]],
            [1, this.players[this.bigblind]],
            [this.players.length - 1, this.players[this.button]]
        ]);

        const turnOrderIndex = 2;

        while (turnOrderIndex < this.players.length - 1) {
            this.bettingOrder.set(turnOrderIndex, this.players[this.smallblind + turnOrderIndex]);
            index += 1;
        }

        {
            console.log(this.bettingOrder);
        }

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

        this.potsize = 0;
        this.minbet = 10;

        this.blinds = {
            big: this.minbet,
            small: this.minbet / 2
        };

        this.blindsExpected = new Map();
        this.blindsPosted = new Set();

        this.blindsExpected.set(this.players[this.smallblind], this.blinds.small);
        this.blindsExpected.set(this.players[this.bigblind], this.blinds.big);

        this.gameEvent = new GameEvent();

        this.gameEvent.on('post-blinds', (playerid, blind, onposted) => {
            if (this.blindsExpected.has(playerid)) {
                if (!this.blindsPosted.has(playerid)) {
                    this.blindsPosted.add(playerid);

                    console.log(playerid + ' posted blinds');

                    potsize += this.blindsExpected.get(playerid);

                    onposted(potsize, (onUtg) => {
                        if (potsize === (this.blinds.big + this.blinds.small) || this.blindsExpected.size === 2) {
                            onUtg();
                        }
                    });
                }
            }
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
}

module.exports = Game;