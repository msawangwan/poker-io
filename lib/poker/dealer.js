class Dealer {
    constructor() {
        this.id = 0;

        this.positions = new Map();

        for (let i = 0; i < 9; i++) {
            this.positions.set(i, {
                isSmallBlind: false,
                isBigBlind: false,
                isDealer: false,
                bets: {
                    postedAnte: false,
                    history: []
                }
            });
        }
    }

    /* 
        what does the dealer do?
        - it assigns the buttons (sb, bb, dealer)
        - it asks for sb and bb to post blinds
            - it marks the bb player as the 'bet anchor'
            - it marks the bb+1 player as 'utg'
        - it deals each player a hand
        - starting from bb+1 (utg):
            - next player = bb+1
        - determine allowed actions for current player:
            
        - determine allowed action for next player:
            - if num circulations < 3:
                - yes:
                    - allowed actions:
                        - if abs(total bet so far - min bet) === 0:
                            'check', 'raise'/'bet', 'fold'
                        - if abs(total bet so far - min bet) > 0:
                            'call', 'reraise', 'fold'
                - no:
                    -allowed actions:
                        - if abs(total bet so far - min bet) === 0:
                            'check', 'fold'
                        - if abs(total bet so far - min bet) > 0:
                            'call', 'fold'
        - update next player:
            - if next player === 'bet anchor':
                -



            - current player === bet anchor:
                - yes:
                    - if num circulations < 3:
                - no:
                    - current player bet > min bet?
                        - current player bet = min bet
                        - mark current player as 'bet anchor'
                        - reset all player 'total bet so far'?
    */
}