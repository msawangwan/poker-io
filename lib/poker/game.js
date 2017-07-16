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


    this.deck = new Map();
    this.players = new Map();
    this.seating = new Map();

    for (let i = 0; i < 9; i++) {
        this.seating.set(i, {
            vacant: true,
            player: undefined
        });
    }

    this.currentDeal = {
        id: -1, started: false
    };

    this.dealHistory = [{ id: -1, started: true }];
    this.lastDeal = () => this.dealHistory[this.dealHistory.length - 1];

    this.deckShuffleIds = new Set();

    this.seatedPlayers = () => [...this.seating].filter(([pos, seat]) => !seat.vacant);

    this.playerQueue = {
        readyup: new Set(),
        onready: [],
        readyForDeal: new Set()
    };

    this.state = -1;

    this.stateChangeEvent = new GameEvent();
    this.deckEvent = new GameEvent();
    this.playerEvent = new GameEvent();
    this.dealerEvent = new GameEvent();

    this.stateChangeEvent.once('game-start', (current, onchange) => {
        console.log('game started!');

        this.enterNextState(current);
        this.dealHistory = [-1];

        onchange(this.state);
    });

    this.playerEvent.on('player-seated', (addedPlayer, seatIndex, onadd) => {
        this.seating.set(seatIndex, {
            vacant: false,
            player: addedPlayer
        });

        console.log(`number of players seated: ${this.seatedPlayers().length}`);

        onadd(this.state);
    });

    this.playerEvent.on('player-readyup', (playerid, onreadyup) => {
        if (this.currentDeal.id === this.lastDeal.id) {
            this.currentDeal = { id: this.lastDeal.id, started: false };
        }

        if (!this.playerQueue.readyup.has(playerid)) {
            console.log('player readyup: ' + playerid);
            this.playerQueue.readyup.add(playerid);
            onreadyup(this.currentDeal);
        }
    });

    this.playerEvent.on('player-ready-for-deal', (playerid, dealid, onreadyfordeal) => {
        if (!this.deckShuffleIds.has(dealid)) { // only the first caller of a given dealid will run this block
            this.deck = this.createNewDeck();
            this.deck = this.newDeckShuffle(4);
            this.deckShuffleIds.add(dealid);
        }

        if (!this.playerQueue.readyForDeal.has(playerid)) {
            this.playerQueue.readyForDeal.add(playerid);
        }

        if (this.playerQueue.readyForDeal.size >= this.playerQueue.readyup.size) {
            this.currentDeal.started = true;
        }

        onreadyfordeal();
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

    this.state = stateTable.get(current);

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