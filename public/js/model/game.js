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

    set theBigBlind(i) {
        this.bigBlind = i;
    }

    set theSmallBlind(i) {
        this.smallBlind = i;
    }

    set theButton(i) {
        this.button = i;
    }

    get theBigBlind() {
        return this.bigBlind;
    }

    get theSmallBlind() {
        return this.smallBlind;
    }

    get theButton() {
        return this.button;
    }
}