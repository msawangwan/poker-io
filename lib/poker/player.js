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

    byId(pid) {
        const p = [...this.states].find(p => p[1].id === pid);

        if (p) {
            return p[1];
        }

        return null;
    }

    byOrderIndex(i) {
        const p = [...this.states].find(p => p[1].betOrderIndex = i);

        if (p) {
            return p[1];
        }

        return null;
    }

    inAction(cur) {
        const p = [...this.states].find(p => p[1].hasBetAction(cur));

        if (p) {
            return p[1];
        }

        return null;
    }

    nextInOrder(cur, counted, reverse) {
        if (counted > this.playerCount) {
            return null;
        }

        let i = (cur + 1) % this.playerCount;

        if (reverse) {
            i = ((cur - 1) + this.playerCount) % this.playerCount;
        }

        const player = this.byOrderIndex(i);

        if (player.hasFolded) {
            return this.nextInOrder(i, counted + 1, reverse);
        } else {
            return player;
        }
    }

    static bet(player, round, type, amount) {
        player.history[round].push({
            type: type,
            amount: amount
        });

        return player;
    }

    static owes(player, round, owed) {
        const history = player.history[round];

        if (!history.length) {
            return owed;
        }

        const total = history.reduce((bet, sum) => bet.owed + sum);

        return owed - total;
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
            history: {
                blind: [],
                deal: [],
                flop: [],
                turn: [],
                river: []
            },
            get isValid() { return this.id !== -1; },
            get isSmallBlind() { return this.betOrderIndex === 0; },
            get isBigBlind() { return this.betOrderIndex === 1; },
            get isDealer() { return this.buttonIndex !== -1 && this.betOrderIndex === this.buttonIndex; },
            hasBetAction(cur) { return this.betOrderIndex === cur; }
        };
    }

    static logState(p, message) {
        if (p) {
            console.log(
                `player state logger
                ${message ? message : 'status'}
                `
            );
            console.log(p);
            console.log('\n');
        }
    }

    static logAllState(ps, onlyValid) {
        if (ps) {
            for (const p of ps) {
                if (onlyValid && !p[1].isValid) {
                    continue;
                }

                Player.logState(p);
            }
        }
    }
}

module.exports = Player;