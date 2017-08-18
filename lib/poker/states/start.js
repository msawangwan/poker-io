const DealerState = require('./dealerstate');

class StartState extends DealerState {
    constructor(id, name, dealer) {
        super(id, name, dealer);
    }

    process(player, action) {
        this.hasCompleted = true;
        return super.process(player, action);
    }
}

module.exports = StartState;