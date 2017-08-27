class Board {
    constructor() {
        // this.communityCards = {
        //     a: null,
        //     b: null,
        //     c: null,
        //     d: null,
        //     e: null
        // };

        this.communityCards = [];
    }

    add(...card) {
        for (const c of card) {
            this.communityCards.push(c);
        }
        // if (this.communityCards[label] === null) {
        //     this.communityCards[label] = card;
        //     return true;
        // }
        // return false;
    }
}

module.exports = Board;