const Card = require('./card');

const EventEmitter = require('events');

class GameEvent extends EventEmitter { }


const rand = (min, max) => Math.floor(Math.random() * (max - min) + min);

const phase = ([
    [-1, 'waiting-for-players'],
    [0, 'new-deck-shuffle'],
    [1, 'deal-cards'],
    [2, 'pre-flop-bet'],
    [3, 'burn'],
    [4, 'flop'],
    [5, 'post-flop-bet'],
    [6, 'burn'],
    [7, 'fourth-street-card-turn'],
    [8, 'post-fourth-street-bet'],
    [9, 'burn'],
    [10, 'river-card-turn'],
    [11, 'post-river-bet'],
    [12, 'showdown'],
    [13, 'pay-out-winner']
]);

const stateTable = new Map([
    [-1, 0],
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
]);

const suites = [0, 1, 2, 3];
const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function Game(name, id) {
    this.name = name;
    this.id = id;

    this.hasStarted = false;

    this.deck = new Map();
    this.players = new Map();
    this.seating = new Map();

    for (let i = 0; i < 9; i++) {
        this.seating.set(i, {
            vacant: true,
            player: undefined
        });
    }

    const startingThreshold = 1;

    this.handId = [];

    this.seatedPlayers = () => [...this.seating].filter(([pos, seat]) => !seat.vacant);

    this.state = -1;

    this.gamestateNotifier = new GameEvent();
    this.stateChangeEvent = new GameEvent();
    this.dealerEvent = new GameEvent();

    this.gamestateNotifier.once('game-started', (onstart) => {
        this.state = 1;
        this.hasStarted = true;

        onstart(this.state);
    });

    this.stateChangeEvent.once('game-start', (onstart) => {
        this.hasStarted = true;

        onstart(this.state);
    });

    this.stateChangeEvent.on('player-added', (addedPlayer, seatIndex, onadd) => {
        this.seating.set(seatIndex, {
            vacant: false,
            player: addedPlayer
        });

        if (this.seating.size > startingThreshold) {
            this.enterNextState(this.state);
        }

        onadd(this.state);
    });

    this.readyQueue = new Set();
    this.readyupQueue = [];

    this.dealerEvent.on('player-ready', (playerid, onready) => {
        if (!this.readyQueue.has(playerid)) {
            console.log('adding player to ready queue..');
            this.readyQueue.add(playerid);
            this.readyupQueue.push(onready);
            console.log(`ready queue size: ${this.readyQueue.size}`);
            console.log(`player count: ${this.seatedPlayers().length}`);
            if (this.readyQueue.size === this.seatedPlayers().length) {
                console.log('switching to state 2, deck shuffle')
                this.state = 2;

                const queueLength = this.readyupQueue.length - 1;

                for (let i = 0; i < queueLength; i++) {
                    const cb = this.readyupQueue.pop();
                    cb(this.state);
                }
            }
        }
    });

    this.dealerEvent.once('shuffle-deck', (onshuffle) => {
        console.log('shuffling da deck ...');

        this.deck = this.createNewDeck();
        this.deck = this.newDeckShuffle(4);

        console.log(this.deck);

        this.state = 3;

        onshuffle(this.state);
    });

    this.dealt = new Set();

    this.dealerEvent.on('deal-hole-cards', (playerid, ondeal) => {
        if (!this.dealt.has(playerid)) {
            this.dealt.add(playerid);

            const a = this.drawCard();
            const b = this.drawCard();

            console.log(`dealt two cards to: ${playerid}`);
            console.log(a.formatted());
            console.log(b.formatted());

            const hand = [a, b, { af: a.formatted(), bf: b.formatted() }];

            if (this.state !== 4) {
                this.state = 4;
            }

            ondeal(hand, this.state);
        }
    });
}

Game.prototype.enterNextState = function (current) {
    if (this.state !== current) {
        console.log(`err: mismatched states [actual] ${this.state} [sent] ${current}`)
        return false;
    }

    this.state = stateTable[current];

    return true;
}

Game.prototype.createNewDeck = function () {
    const deck = new Map();
    let i = 0;

    for (const s of suites) {
        for (const v of values) {
            deck.set(i, Card(s, v));
            i += 1;
        }
    }

    return deck;
};

Game.prototype.newDeckShuffle = function (numberOfShuffles) {
    const deck = this.deck;
    const deckSize = deck.size;

    for (let i = 0; i < numberOfShuffles; i++) {
        let currentCardIndex = 0;
        while (currentCardIndex < deckSize) {
            let randomCardIndex = rand(0, deckSize);

            let currentCard = deck.get(currentCardIndex);
            let randomCard = deck.get(randomCardIndex);

            deck.set(currentCardIndex, randomCard);
            deck.set(randomCardIndex, currentCard);

            currentCardIndex += 1;
        }
    }

    return deck;
};

Game.prototype.validateDeck = function () {
    const cards = new Set();

    for (const [index, card] of this.deck.entries()) {
        const c = { suite: card.suite, value: card.value };

        if (cards.has(c)) {
            return false;
        }

        cards.add(c);
    }

    return true;
};

Game.prototype.drawCard = function () {
    const deck = this.deck;
    const top = deck.size;
    const card = deck.get(top - 1);

    deck.delete(top - 1);
    this.deck = deck;

    return card;
};

Game.prototype.postBlinds = function () {

};

Game.prototype.dealHoleCards = function (players) {
    for (const p of players) {
        p.holecards.first = {};
        p.holecards.second = {};
    }
};

module.exports = (n, id) => new Game(n, id);

// const testgame = new Game('test', 0);
// testgame.deck = testgame.createNewDeck();
// testgame.deck = testgame.newDeckShuffle(4);
// console.log(testgame.validateDeck());
// console.log(testgame.drawCard())
// console.log(testgame.drawCard())
// console.log(testgame.drawCard())
// console.log(testgame.drawCard())
// console.log(testgame.deck)
// const c = testgame.drawCard();
// console.log(c.formatted());
// console.log(testgame.validateDeck());