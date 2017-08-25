class Player {
    constructor(options) {
        this.states = new Map();

        const max = options.maxPlayersAllowed || 9;

        for (let i = 0; i < max; i++) {
            this.states.set(i, Player.createState(i));
        }
    }

    get playerCount() {
        return [...this.states].filter(p => p[1].isValid).length;
    }

    get allValid() {
        return [...this.states].filter(p => p[1].isValid);
    }

    get ids() {
        return this.allValid.reduce((result, p) => result.concat(p[1].id), []);
    }

    get dealer() {
        return this.allValid.find(p => p[1].isDealer)[1];
    }

    initialise(playerData) {
        const count = playerData.positions.length;
        const button = playerData.dealerPositionIndex;

        for (let i = 0; i < count; i++) {
            const data = playerData.positions[i][1];
            const player = this.states.get(data.seatindex);

            player.id = data.player.id;
            player.stackSize = data.player.balance || 0;
            player.seatIndex = data.seatindex;
            player.buttonIndex = button;
            player.betOrderIndex = (button + (i + 1)) % count;

            this.states.set(data.seatindex, player);
        }
    }

    update(player) {
        this.states.set(player.seatIndex, player);
    }

    byId(pid) {
        const p = [...this.states].find(p => p[1].id === pid);

        if (p) {
            return p[1];
        }

        return null;
    }

    byOrderIndex(i) {
        const p = [...this.states].find(p => p[1].betOrderIndex === i);

        if (p) {
            return p[1];
        }

        return null;
    }

    nextBetOrderIndex(betOrderIndex, counted) {
        if (counted > this.playerCount) {
            return betOrderIndex;
        }

        const i = (betOrderIndex + 1) % this.playerCount;
        const player = this.byOrderIndex(i);

        if (player.hasFolded) { // todo: add optional parameter, a boolean test instead of the fixed 'player.hasFolded' test
            return this.nextBetOrderIndex(i, counted + 1);
        } else {
            return player.betOrderIndex;
        }
    }
    
    mapHand(pid, cards) {
        const player = this.byId(pid);
        
        player.holecards.a = cards.a;
        player.holecards.b = cards.b;
        
        this.update(player);
    }

    consolidateBets(round) {
        for (const p of this.states) {
            p[1].potContribution += p[1].bets[round];
        }
    }

    static chipCount(player, blind) {
        return player.stackSize / blind;
    }

    static createState(i) {
        return {
            id: -1,
            stackSize: 0,
            seatIndex: i,
            buttonIndex: -1,
            betOrderIndex: -1,
            potContribution: 0,
            hasFolded: false,
            holecards: {
                a: null,
                b: null
            },
            bestHand: {
                name: 'none',
                a: null,
                b: null,
                c: null,
                d: null
            },
            bets: {
                blind: 0,
                deal: 0,
                flop: 0,
                turn: 0,
                river: 0
            },
            get isValid() { return this.id !== -1; },
            get isSmallBlind() { return this.betOrderIndex === 0; },
            get isBigBlind() { return this.betOrderIndex === 1; },
            get isDealer() { return this.buttonIndex !== -1 && this.seatIndex === this.buttonIndex; }
        };
    }
}

module.exports = Player;