const DealerState = require('./dealerstate');

class BlindState extends DealerState {
    constructor(id, name, dealer) {
        super(id, name, dealer);
    }

    process(player, action) {
        const state = super.process(player, action);

        if (player.state.isSmallBlind) {
            if (action.amount !== this.dealer.blindBet * 0.5) {
                action.amount = this.dealer.blindBet * 0.5;
            }
        } else if (player.state.isBigBlind) {
            if (action.amount !== this.dealer.blindBet) {
                action.amount = this.dealer.blindBet;
            }
        }
        
        this.dealer.handleBetAction(player, action);
        
        // this.dealer.handlePlayerBet(
        //     player.state.id,
        //     action.type,
        //     this.name,
        //     action.amount
        // );

    
        return state;
    }
    
    processAction(dealer, player, action) {
       if (player.state.isSmallBlind) {
           if (action.amount !== this.dealer.blindBet * 0.5) {
               action.amount = this.dealer.blindBet * 0.5;
           }
       } else if (player.state.isBigBlind) {
           if (action.amount !== this.dealer.blindBet) {
               action.amount = this.dealer.blindBet;
           }
       }

        return {
            potSize: dealer.potSize + action.amount,
        };
    }
}

module.exports = BlindState;