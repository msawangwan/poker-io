const DealerState = require('./dealerstate');

class StartState extends DealerState {
    constructor(id, name, dealer) {
        super(id, name, dealer);
    }

    process(dealer, player, action) {
        this.hasCompleted = true;
        return super.process(dealer, player, action);
    }
}

module.exports = StartState;