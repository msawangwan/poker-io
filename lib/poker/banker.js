class Banker {
    constructor() {
        this.clients = new Map();
    }

    registerClient(c, balance) {
        this.clients.set(c, balance);
    };

    getBalance(c) {
        return this.clients.get(c);
    };

    setBalance(c, balance) {
        this.clients.set(c, balance);
    };
}

module.exports = Banker;