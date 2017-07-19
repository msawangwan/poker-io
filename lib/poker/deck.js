const EventEmitter = require('events');
const IdUtil = require('../id-util');
const Card = require('./card');

const ids = IdUtil();

const rand = (min, max) => Math.floor(Math.random() * (max - min) + min);

const suites = [0, 1, 2, 3];
const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

class DeckEvent extends EventEmitter { } // TODO: hook up events!

class Deck {
    constructor() {
        this.id = Deck.nextDeckId();

        this.deckEvent = new DeckEvent();
        this.cards = new Map();

        let i = 0;

        for (const s of suites) {
            for (const v of values) {
                this.cards.set(i, Card(s, v));
                i += 1;
            }
        }

        this.deckEvent.emit('created');
    };

    draw() {
        const last = this.cards.size - 1;
        const c = this.cards.get(last);

        this.cards.delete(last);
        this.deckEvent.emit('card-drawn', c);

        return c;
    };

    static shuffle(deck, times) {
        const d = deck.cards;
        const size = d.size;

        for (let i = 0; i < times; i++) {
            let currentindex = 0;
            while (currentindex < size) {
                let otherindex = rand(0, size);

                let curr = d.get(currentindex);
                let other = d.get(otherindex);

                d.set(currentindex, other);
                d.set(otherindex, curr);

                currentindex += 1;
            }
        }

        return d;
    };

    static validate(deck) {
        const cards = new Set();

        for (const [index, card] of deck.cards) {
            const c = `${card.suite}::${card.value}`;

            if (cards.has(c)) {
                return false;
            }

            cards.add(c);
        }

        return true;
    };

    static nextDeckId() {
        return ids.generateNextId();
    };
}

module.exports = Deck;

// const testdeck = new Deck();

// console.log(testdeck.cards);
// console.log(Deck.validate(testdeck));

// testdeck.cards = Deck.shuffle(testdeck, 5);

// console.log(testdeck.cards);
// console.log(Deck.validate(testdeck));

// console.log(testdeck.draw());
// console.log(testdeck.draw());
// console.log(testdeck.draw());