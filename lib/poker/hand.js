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

    // todo: ACEs must count lo and hi
    determine(community) {
        console.log(community);
        const cards = [[], [], [], [], [], [], [], [], [], [], [], [], []];
        const suites = [[], [], [], []];

        const holecards = [this.holecards.a, this.holecards.b]

        for (const hc of holecards) {
            cards[hc.value].push(hc);
        }

        for (const cc of community) {
            if (cc) {
                console.log(cc);
                cards[cc.value].push(cc);
            }
        }

        let best = 9;
        let seq = 0;
        let flush = false;

        for (let i = 0; i < cards.length; i++) {
            if (cards[i].length) {
                suites[cards[i].suite] = cards[i];

                if (suites.length > 4) {
                    flush = true;
                    best = this.rankings['flush'] < best ? this.rankings['flush'] : best;
                }

                seq += 1;

                if (seq > 4) {
                    if (flush) {
                        best = this.rankings['straight-flush'];
                    }

                    if (this.rankings['straight'] < best) {
                        best = this.rankings['straight'];
                    }

                    break;
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
            } else {
                seq = 0;
            }

            console.log(seq, cards[i]);
        }

        console.log(cards);

        return best;
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