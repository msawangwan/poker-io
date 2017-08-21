// A betting round ends when two conditions are met:
// All players have had a chance to act.
// All players who haven't folded have bet the same amount of money for the round


class Dealer {
    constructor(options) {
        this.options = {
            cap: options.cap || 3
        };
    }

    static passActionToNext(state, player, difference) {
        const turn = {
            actions: [],
            owes: difference
        };

        if (player.isSmallBlind || player.isBigBlind && state.name === 'blind') {
            turn.actions.push('postblind');
        } else {
            turn.actions.push('fold');

            if (state.isOpen) {
                turn.actions.push('bet');
            } else {
                // turn.owes = Player.owes(player, state.name, potsize);

                if (turn.owes > 0) {
                    turn.actions.push('call');
                } else {
                    turn.actions.push('check');
                    if (turn.owes < 0) {
                        turn.owes = 0;
                    }
                }

                turn.actions.push('raise');
            }
        }

        return turn;
    }

    // dealHolecards() {
    //     this.currentRound = 'deal';

    //     const dealt = new Map();

    //     for (const p of this.positions) {
    //         dealt.set(p[1].state.id, {
    //             a: null, b: null
    //         });
    //     }

    //     for (const p of this.positions) {
    //         dealt.get(p[1].state.id).a = this.deck.draw();
    //     }

    //     for (const p of this.positions) {
    //         dealt.get(p[1].state.id).b = this.deck.draw();
    //     }

    //     return dealt;
    // }

    // dealFlop() {
    //     this.currentRound = 'flop';

    //     const flop = new Map();
    //     const burn = this.deck.draw();

    //     let i = 0;

    //     while (i < 3) {
    //         flop.set(i, this.deck.draw());
    //         i++;
    //     }

    //     return flop;
    // }
}

module.exports = Dealer;