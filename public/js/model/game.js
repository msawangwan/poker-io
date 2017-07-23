class Game {
    constructor(players, currentplayer) {
        this.id = null;

        this.currentplayer = currentplayer;
        this.players = players;

        this.playerCount = this.players.length;
        this.lastPlayerIndex = this.playerCount - 1;

        this.positions = {
            button: this.lastPlayerIndex,
            smallBlind: () => this.positions.button + 1 % this.playerCount,
            bigBlind: () => this.positions.button + 2 % this.playerCount,
        };

        this.handId = -1;
    }

    set button() {
        this.positions.button += 1 % this.playerCount;
    }

    deal() {
        for (const player of players) {
            if (player.id !== this.currentplayer) {
                // draw back of cards
                continue;
            }

            player.dealHandler();
        }
    };
}