class House {
    constructor(deck, options) {
        if (!deck) {
            console.error('err: deck cannot be null!');
        }

        this.deck = deck;
    }

    shuffleDeck(n) {
        this.deck.shuffle(n);
    }

    deal(round, playersById) {
        switch (round) {
            case 'hand':
                return this.drawHoleCardsAndDeal(playersById);
            case 'flop':
                return this.drawCardWithBurn(3);
            case 'turn':
                return this.drawCardWithBurn(1);
            case 'river':
                return this.drawCardWithBurn(1);
        }
    }

    drawHoleCardsAndDeal(playerIds) {
        const dealt = new Map();

        for (const pid of playerIds) { // first pass
            if (dealt.has(pid)) {
                continue;
            }

            dealt.set(pid, {
                a: this.deck.draw(),
                b: null
            });
        }

        for (const pid of playerIds) { // second pass
            if (dealt.get(pid).b !== null) {
                continue;
            }

            dealt.get(pid).b = this.deck.draw();
        }

        return [...dealt];
    }

    drawCardWithBurn(n) {
        const cards = [];
        const burn = this.deck.draw();

        for (let i = 0; i < n; i++) {
            cards[i] = this.deck.draw();
        }

        return cards;
    }
}

module.exports = House;