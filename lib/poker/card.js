const validSuites = ['hearts', 'diamonds', 'clubs', 'spades'];
const validValues = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king', 'ace'];

class Card {
    constructor(suite, value) {
        this.suite = suite;
        this.value = value;
        
        // this.suite = {
        //     index: suite,
        //     formatted: validSuites[suite]
        // };
        
        // this.value = {
        //     index: value,
        //     formatted: validValues[value]
        // };
    }
    
    formatted() {
        return {
            suite: validSuites[this.suite],
            value: validValues[this.value]
            // suite: this.suite.formatted,
            // value: this.value.formatted
        };
    }
    
    clone() {
        return new Card(this.suite, this.value);
    }
}

module.exports = (s, v) => new Card(s, v);