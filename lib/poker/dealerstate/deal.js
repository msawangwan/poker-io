const DealerState = require('./dealerstate');

class DealState extends DealerState {
    constructor(id, name, dealer) {
        super(id, name, dealer);
    }

    process(dealer, player) {
        this.hasCompleted = true;
        return super.process(dealer, player, action);
    }
}

module.exports = DealState;