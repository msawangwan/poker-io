const validSuites = ['spades', 'clubs', 'diamonds', 'hearts'];
const validValues = ['ace', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king'];

function Card(suite, value) {
    this.suite = suite;
    this.value = value;
}

Card.prototype.formatted = function () {
    return {
        suite: validSuites[this.suite],
        value: validValues[this.value]
    }
};

Card.prototype.clone = function () {
    return new Card(this.suite, this.value);
};

module.exports = (s, v) => new Card(s, v);