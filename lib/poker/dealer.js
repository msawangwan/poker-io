class Dealer {
    constructor() {
        this.id = 0;

        this.playerIdToBetOrderMapping = new Map();
        this.playerIdToSeatOrderMapping = new Map();
        this.seatIndexToPlayerMapping = new Map();

        for (let i = 0; i < 9; i++) {
            this.seatIndexToPlayerMapping.set(i, {
                id: null,
                betOrder: null,
                isSmallBlind: false,
                isBigBlind: false,
                isDealer: false,
                hasActed: false,
                hasFolded: false,
                isActingPlayer: false,
                bet: {
                    total: 0,
                    history: []
                }
            });
        }

        this.playerCount = 0;

        this.allowedActions = ['postblind'];

        this.totalRequiredToPlay = 0;
        this.largestBetSoFar = 0;
        this.pot = 0;

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

    get smallBlind() {
        return [...this.seatIndexToPlayerMapping].find(([k, v]) => v.isSmallBlind);
    }

    get bigBlind() {
        return [...this.seatIndexToPlayerMapping].find(([k, v]) => v.isBigBlind);
    }

    get dealerButton() {
        return [...this.seatIndexToPlayerMapping].find(([k, v]) => v.isDealer);
    }

    determineBettingOrder(positions, buttonPosition) {
        this.playerCount = positions.length;

        for (let i = 0; i < this.playerCount; i++) {
            const betorder = (buttonPosition + (i + 1)) % this.playerCount;
            const seatindex = positions[i][1].seatindex;
            const id = positions[i][1].player.id;

            this.playerIdToSeatOrderMapping.set(id, seatindex);
            this.playerIdToBetOrderMapping.set(id, betorder);

            const seat = this.seatIndexToPlayerMapping.get(seatindex);

            seat.id = id;
            seat.betOrder = betorder;

            if (betorder === 0) {
                seat.isSmallBlind = true;
            }

            if (betorder === 1) {
                seat.isBigBlind = true;
            }

            if (betorder === (this.playerCount - 1)) {
                seat.isDealer = true;
            }

            this.seatIndexToPlayerMapping.set(seatindex, seat);
        }
    }

    handleBlind(fromPlayer) {
        const s = this.playerIdToSeatOrderMapping.get(fromPlayer);
        const seat = this.seatIndexToPlayerMapping.get(s);

        let bet = this.minbet;

        if (seat.isSmallBlind) {
            bet *= 0.5;
        }

        seat.bet.history.push(this.minbet)
        seat.hasActed = true;

        this.seatIndexToPlayerMapping.set(s, seat);
    }

    handleBet(seatIndex, betAmount) {
        const current = this.seatIndexToPlayerMapping.get(seatIndex);

        if (current.hasFolded) {
            return 0;
        }

        current.bet.total += betAmount;

        if (betAmount > this.largestBetSoFar) {
            this.largestBetSoFar = betAmount;
            this.betAnchor = seatIndex;
        }

        return this.largestBetSoFar;
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

module.exports = Dealer;