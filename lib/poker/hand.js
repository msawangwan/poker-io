class Hand {
    constructor() {
        this.cards = {
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

    // todo: ACEs must count lo and hi
    determine(holecards, community) {
        const cards = [[], [], [], [], [], [], [], [], [], [], [], [], []];

        for (const hc of holecards) {
            cards[hc.value].push(hc);
        }

        for (const cc of community) {
            cards[cc.value].push(cc);
        }

        let best = -100;
        let seq = 0;
        // todo: also trask suites here

        for (let i = 0; i < cards.length; i++) {
            if (cards[i].length) {
                seq += 1;
                if (seq > 4) {
                    const lo = i - 4;
                    const hi = i;

                    let flush = true;
                    let suite = cards[lo].suite;

                    for (let j = lo; j < hi + 1; j++) {
                        if (suite !== j) {
                            flush = false;
                            break;
                        }
                    }

                    if (flush) {
                        best = this.rankings['straight-flush'];
                    }

                    if (false) {
                        best = this.rankings['flush'] > best ? this.rankings['flush'] : best;
                    }

                    if (this.rankings['straight'] > best) {
                        best = this.rankings['straight'];
                    }

                    break;
                }
            } else {
                seq = 0;
            }
            console.log(seq, cards[i]);
        }

        console.log(cards);

        return best;
    }
}

module.exports = Hand;