class Players {
    constructor(options) {
        this.states = new Map();

        const max = options.maxPlayersAllowed || 9;

        for (let i = 0; i < max; i++) {
            this.states.set(i, Players.create(i));
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
            player.seatIndex = data.seatindex;
            player.buttonIndex = button;
            player.betOrderIndex = (button + (i + 1)) % count;

            this.states.set(data.seatindex, player);
        }
    }

    findPlayerById(pid) {
        const p = [...this.states].filter(p => p[1].id === pid);

        if (p) {
            return p[1];
        }

        return null;
    }

    static create(i) {
        return {
            id: -1,
            seatIndex: i,
            buttonIndex: -1,
            betOrderIndex: -1,
            get isValid() { return this.id !== -1; },
            get isSmallBlind() { return this.betOrderIndex === 0; },
            get isBigBlind() { return this.betOrderIndex === 1; },
            get isDealer() { return this.buttonIndex !== -1 && this.betOrderIndex === this.buttonIndex; }
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

                Players.logState(p);
            }
        }
    }
}

module.exports = Players;