const validSuites = ['hearts', 'diamonds', 'clubs', 'spades'];
const validValues = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king', 'ace'];

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