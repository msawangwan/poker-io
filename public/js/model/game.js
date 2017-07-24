class Game {
    constructor(id, players) {
        this.id = id;
        this.players = players;

        this.positions = new Map();

        for (const player of this.players) {
            this.positions.set(player.seatPositionIndex, {
                turnPosition: null,
                player: player
            });
        }
    };

    get onTheButton() {
        return this.button;
    };

    get smallBlind() {
        return this.button + 1 % this.players.length;
    };

    get bigBlind() {
        return this.button + 2 % this.players.length;
    };

    assignButton(i) {
        console.log('==');
        for (const [pos, player] of this.positions) {
            console.log(pos);
            console.log(player);
            // if (this.players.turnPosition)
        }
        console.log('==');
    };
}