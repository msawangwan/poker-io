const validSuites = ['spades', 'clubs', 'diamonds', 'hearts'];
const validValues = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'];

function Card(suite, value) {
    this.suite = suite;
    this.value = value;
}

module.exports = (s, v) => new Card(s, v);