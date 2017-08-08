class Dealer {
    constructor() {
        this.id = 0;

        this.positions = new Map();

        for (let i = 0; i < 9; i++) {
            this.positions.set(i, {
                isSmallBlind: false,
                isBigBlind: false,
                isDealer: false,
                isFolded: false,
                bets: {
                    // postedAnte: false,
                    total: 0,
                    history: []
                }
            });
        }

        this.allowedActions = ['call', 'raise', 'fold'];

        this.minbet = {
            default: 10,
            current: 10,
        };
    }

    get numCirculations() {
        return this.circulations;
    }

    set numCirculations(i) {
        this.circulations = i;
    }

    get currentBetAnchor() {
        return this.betAnchor;
    }

    set currentBetAnchor(ba) {
        this.betAnchor = ba;
    }

    setSb(sb) {
        this.positions.get(sb).isSmallBlind = true;
    }

    setBb(bb) {
        this.positions.get(bb).isBigBlind = true;
    }

    setDealer(d) {
        this.positions.get(d).isDealer = true;
    }

    handleGame(seatIndex, currentBet) {
        const current = this.positions.get(seatIndex);

        if (current.isFolded) {
            return 0;
        }

        current.bet.total += currentBet;

        if (this.minbet.current < currentBet) {
            this.minbet.current = currentBet;
        }

        const owed = Math.abs(current.bet.total - this.minbet.current);
    }

    /* 
        what does the dealer do?

            - assign the buttons (sb, bb, dealer)
            - ask sb and bb to post blinds
                - mark the bb player as bet anchor

            - deal each player a hand

            - set current player in action = bet anchor position + 1
            - set default allowed actions = ['call', 'raise', 'fold']
            - set last bet = min bet

            - while (num circs < 4):
                - owed = abs(current player total bet so far - last bet)

                - allowed actions = ['fold']

                - if owed === 0:
                    - allowed actions += ['check']

                - if owed > 0:
                    - allowed actions += ['call']

                - if num circs < 3:
                    - allowed actions += ['raise']

                if current player === bet anchor position:
                    num circs += 1
    */
}