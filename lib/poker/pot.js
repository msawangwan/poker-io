class Pot {
    constructor(options) {
        this.options = {
            blind: options.blind || 10
        };

        this.bets = {
            current: [],
            total: 0
        };

        this.history = new Map();
    }

    placeBet(round, amount) {
        const bet = Pot.newBet(round, amount);
        this.bets.current.push(bet);
        return bet;
    }

    collectBets() {
        let lastId = this.history.size;

        do {
            const bet = this.bets.current.pop();

            this.bets.total += bet.amount;
            this.history.set(lastId, bet);
            
            lastId += 1;
        } while (this.bets.current.length > 0);
    }

    static newBet(round, amount) {
        return {
            round: round,
            amount: amount
        };
    }
}

module.exports = Pot;