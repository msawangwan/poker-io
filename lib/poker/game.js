const cardctr = require('./card');

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
}

Game.prototype.waitingForPlayers = function (threshold) {
    if (this.players.size > threshold) {
        return true;
    }

    return false;
};

Game.prototype.createNewDeck = function () {
    const deck = new Map();
    let i = 0;

    for (const s of suites) {
        for (const v of values) {
            deck.set(i, cardctr(s, v));
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