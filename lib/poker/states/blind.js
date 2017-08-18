const DealerState = require('./dealerstate');

class BlindState extends DealerState {
    constructor(id, name, dealer) {
        super(id, name, dealer);
    }

    process(player, action) {
        const state = super.process(player, action);

        if (player.state.isSmallBlind) {
            this.dealer.handlePlayerBet(player.state.id, )
        }

        return state;
    }
}

module.exports = BlindState;