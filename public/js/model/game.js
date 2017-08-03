class Game {
    constructor(id, players) {
        this.id = id;
        this.players = players;

        this.bets = new Map();
    }

    playerPlacedBet(id, amount) {
        const b = this.bets.get(id);

        if (!b) {
            this.bets.set(id, [amount]);
        } else {
            b.push(amount);
        }
    }

    getPlayerBets(id) {
        return this.bets.get(id) ? this.bets.get(id) : null;
    }

    set theButton(i) {
        this.button = i;
    }

    get onTheButton() {
        return this.button;
    }
}