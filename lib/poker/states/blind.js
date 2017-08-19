const DealerState = require('./dealerstate');

class BlindState extends DealerState {
    constructor(id, name) {
        super(id, name);
        
        // this.dealer = null;
    }
    
    get dealer() {
        return this.localDealer;
    }
    
    set dealer(d) {
        if (this.localDealer) {
            return;
        }
        
        this.localDealer = d; 
    }

    setup(pot) {
        
    }

    process(player, action, bet) {
        const blind = this.dealer.state.pot.blind;

        let b = bet.amount;

        if (player.isSmallBlind) {
            if (b !== blind * 0.5) {
                b = blind * 0.5;
            }
        } else if (player.isBigBlind) {
            if (b !== blind) {
                b = blind;
            }
        }

        dealer.state.pot.size += b;

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