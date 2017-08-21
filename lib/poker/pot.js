class Pot {
    constructor(options) {
        this.options = {
            blind: options.blind || 10
        };

        this.bets = {
            active: 0,
            total: 0
        };

        this.history = new Map();
    }

    get size() {
        return this.bets.total;
    }

    get sizeCurrent() {
        return this.bets.active;
    }

    placeBet(round, amount) {
        const bet = Pot.newBet(round, amount);
        this.bets.active += amount;
        return bet;
    }

    collectBets() {
        this.bets.total += this.bets.active;
        this.bets.active = 0;
    }

    static newBet(round, amount) {
        return {
            round: round,
            amount: amount
        };
    }
}

module.exports = Pot;