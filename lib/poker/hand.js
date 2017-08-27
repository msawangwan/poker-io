class Hand {
    constructor(holecards) {
        this.holecards = holecards;

        this.bestHand = {
            a: null,
            b: null,
            c: null,
            d: null,
            e: null
        };

        this.rankings = {
            'straight-flush': 0,
            'four-of-a-kind': 1,
            'full-house': 2,
            'flush': 3,
            'straight': 4,
            'three-of-a-kind': 5,
            'two-pair': 6,
            'pair': 7,
            'high-card': 8,
            'nothing': 9
        };
    }

    handRankString(score) {
        for (const r in this.rankings) {
            if (this.rankings[r] === score) {
                return r;
            }
        }
    }

    allCards(community) {
        const holecards = [this.holecards.a, this.holecards.b];
        const cards = [[], [], [], [], [], [], [], [], [], [], [], [], []];

        for (const hc of holecards) {
            cards[hc.value].push(hc);
        }

        for (const cc of community) {
            if (cc) {
                cards[cc.value].push(cc);
            }
        }

        return cards;
    }

    // todo: ACEs must count lo and hi
    determine(community) {
        const cards = this.allCards(community);
        const suites = [[], [], [], []];

        let best = 9;
        let flush = false;
        let straight = false;
        let hicard = -1;
        let flushsuite = -1;
        let straightcards = [];
        let actualstraight = [];

        for (let i = 0; i < cards.length; i++) {
            if (cards[i].length) {
                for (const c of cards[i]) {
                    const curval = c.value;
                    const cursuite = c.suite;

                    if (curval > hicard) {
                        hicard = curval;
                    }

                    suites[cursuite].push(c);

                    if (suites[cursuite].length > 4) {
                        flush = true;
                        flushsuite = cursuite;
                        best = this.rankings['flush'] < best ? this.rankings['flush'] : best;
                    }

                    if (!straightcards.length) {
                        straightcards.push(c);
                    } else {
                        const last = straightcards[straightcards.length - 1].value;

                        if (curval === last + 1) {
                            straightcards.push(c);
                        } else {
                            if (curval !== last) {
                                straightcards = [];
                            }
                        }
                    }

                    if (straightcards.length > 4) {
                        straight = true;
                        actualstraight = straightcards;
                        best = this.rankings['straight'] < best ? this.rankings['straight'] : best;

                        let straightflush = false;

                        for (const c of actualstraight) {
                            if (c.suite !== flushsuite) {
                                straightflush = false;
                                break;
                            }
                            straightflush = true;
                        }

                        if (straightflush) {
                            best = this.rankings['straight-flush'];
                        }
                    }
                }

                if (cards[i].length > 3) {
                    best = this.rankings['four-of-a-kind'] < best ? this.rankings['four-of-a-kind'] : best;
                }

                if (cards[i].length > 2) {
                    best = this.rankings['three-of-a-kind'] < best ? this.rankings['three-of-a-kind'] : best;
                }

                if (cards[i].length > 1) {
                    best = this.rankings['pair'] < best ? this.rankings['pair'] : best;
                }
            }
        }

        return best;
    }

    highCard(community) {
        const cards = this.allCards(community);
        let hi = null;

        for (const cs of cards) {
            if (cs.length) {
                for (const c of cs) {
                    if (!hi) {
                        hi = c;
                    } else if (c.value > hi.value) {
                        hi = c;
                    }
                }
            }
        }

        return hi;
    }

    static type(name, suite, value) {
        return {
            name: name,
            suite: suite,
            value: value
        };
    }
}

module.exports = Hand;