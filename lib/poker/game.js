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

        this.turnOrder = new Map();
        this.bets = new Map();
        this.folded = new Set();

        this.currentActionOnPlayer = 1;

        this.potsize = 0;
        this.minbet = 10;

        this.gameEvent = new GameEvent();

        // this.gameEvent.once('posted-small-blind', (currentActedId, amount, onpost) => {
        this.gameEvent.once('smallblind', (currentActedId, amount, onpost) => {
            this.potsize += amount;

            const nextToActId = this.nextToAct;

            this.gameEvent.emit('notify-next-to-act', nextToActId, 'bigblind', this.minbet);
            this.passActionToNextPlayer();

            {
                console.log('===');
                console.log('player posted small blind');
                console.log(currentActedId);
                console.log(amount);
                console.log('===');
            }

            onpost(this.potsize);
        });

        // this.gameEvent.once('posted-big-blind', (currentActedId, amount, onpost) => {
        this.gameEvent.once('bigblind', (currentActedId, amount, onpost) => {
            this.potsize += amount;

            const nextToActId = this.nextToAct;

            this.gameEvent.emit('notify-next-to-act', nextToActId, 'anteup', this.minbet);
            this.passActionToNextPlayer();

            {
                console.log('===');
                console.log('player posted big blind');
                console.log(currentActedId);
                console.log(amount);
                console.log('===');
            }

            {
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
            }

            onpost(this.potsize);
        });

        // this.gameEvent.on('ante-up-call', (currentActedId, amount, oncall) => {
        this.gameEvent.on('anteup', (currentActedId, amount, oncall) => {
            this.potsize += amount;

            const nextToActId = this.nextToAct;

            this.gameEvent.emit('notify-next-to-act', nextToActId, 'checkorraise', this.minbet)
            this.passActionToNextPlayer();

            {
                console.log('==');
                console.log('ante up called');
                console.log(currentActedId);
                console.log('==');
            }

            oncall(this.potsize);
        });

        // this.gameEvent.on('ante-up-raised', (id, amount, onraise) => {
        this.gameEvent.on('raiseante', (id, amount, onraise) => {
            console.log('ante raised');
            this.potsize += amount;

            const nextToActId = this.nextToAct;

            this.gameEvent.emit('notify-next-to-act', nextToActId, 'callorreraiseorfold', this.minbet)
            this.passActionToNextPlayer();

            onraise(this.potsize);
        });

        // this.gameEvent.on('ante-fold', (id, amount, onfold) => {
        this.gameEvent.on('foldante', (id, amount, onfold) => {
            console.log('ante folded');
            this.folded.add(id);
            onfold(this.potsize);
        });
    };

    get playerCount() {
        return this.players.length;
    };

    get nextToAct() {
        do {
            let nextId = this.turnOrder.get(this.currentActionOnPlayer);

            if (!this.folded.has(nextId)) {
                {
                    console.log('===');
                    console.log(`${nextId} has next action ...`)
                    console.log('===');
                }

                return nextId;
            }

            {
                console.log('===');
                console.log(`${nextId} has folded this hand ...`)
                console.log('===');
            }

            this.passActionToNextPlayer();
        } while (true);
    }

    passActionToNextPlayer() {
        console.log('===');
        console.log('current player has action: ' + this.currentActionOnPlayer);

        this.currentActionOnPlayer += 1 % this.playerCount;
        this.currentActionOnPlayer %= this.playerCount;

        console.log('next player has action: ' + this.currentActionOnPlayer);
        console.log('===');
    };

    updatePlayerTurnOrder(index, playerid) {
        if (!playerid in this.players) {
            console.log('that player isnt in this game');
        } else {
            this.turnOrder.set(index, playerid);

            if (this.turnOrder.size >= this.players.length) {
                this.currentActionOnPlayer = 1;

                {
                    console.log('===');
                    console.log('all players assigned a turn order');
                    console.log('===');
                }

                const nextToActId = this.nextToAct;

                this.gameEvent.emit('notify-next-to-act', nextToActId, 'smallblind', this.minbet);
                this.passActionToNextPlayer();
            }
        }
    };
}

module.exports = Game;