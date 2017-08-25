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
    
    determine(holecards, community) {
        let best = -100;
        
        const { h1, h2 } = holecards;
        // 1)
        // check all suites for matching suites
        // 5)
        // check if holecards make a pair
        // 6)
        // check if any community cards make a pair, trips or quads
        // 7)
        // 
        
        while (true) {
            if (h1.suite === h2.suite) {
                
            }
        }
    }
}