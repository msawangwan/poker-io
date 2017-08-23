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

    placeBet(pid, round, type, amount) {
        const bet = Pot.newBet(pid, round, type, amount);
        this.bets.active += amount;
        return bet;
    }

    collectBets() {
        this.bets.total += this.bets.active;
        this.bets.active = 0;
    }

    static newBet(pid, round, type, amount) {
        return {
            betterid: pid,
            round: round,
            type: type,
            amount: amount
        };
    }
}

module.exports = Pot;