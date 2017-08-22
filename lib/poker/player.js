class Player {
    constructor(options) {
        this.states = new Map();

        const max = options.maxPlayersAllowed || 9;

        for (let i = 0; i < max; i++) {
            this.states.set(i, Player.create(i));
        }
    }

    get playerCount() {
        return [...this.states].filter(p => p[1].isValid).length;
    }

    get allValid() {
        return [...this.states].filter(p => p[1].isValid);
    }

    initialise(playerData) {
        const count = playerData.positions.length;
        const button = playerData.dealerPositionIndex;

        for (let i = 0; i < count; i++) {
            const data = playerData.positions[i][1];
            const player = this.states.get(data.seatindex);

            player.id = data.player.id;
            player.stackSize = 500;
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

        let i = (betOrderIndex + 1) % this.playerCount;

        const player = this.byOrderIndex(i);

        if (player.hasFolded) {
            return this.nextBetOrderIndex(i, counted + 1);
        } else {
            return player.betOrderIndex;
        }
    }

    static chipCount(player, blind) {
        return player.stackSize / blind;
    }

    static create(i) {
        return {
            id: -1,
            stackSize: 0,
            seatIndex: i,
            buttonIndex: -1,
            betOrderIndex: -1,
            potContribution: 0,
            hasFolded: false,
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
            get isDealer() { return this.buttonIndex !== -1 && this.betOrderIndex === this.buttonIndex; }
        };
    }
}

module.exports = Player;