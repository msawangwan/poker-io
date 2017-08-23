class Board {
    constructor() {
        this.communityCards = {
            a: null,
            b: null,
            c: null,
            d: null,
            e: null
        };
    }

    add(label, card) {
        if (this.communityCards[label] === null) {
            this.communityCards[label] = card;
            return true;
        }
        return false;
    }
}

module.exports = Board;