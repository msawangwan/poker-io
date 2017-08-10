class Dealer {
    constructor() {
        this.id = 0;

        this.playerIdToBetOrderMapping = new Map();
        this.playerIdToSeatOrderMapping = new Map();
        this.turnOrderToSeatOrderMapping = new Map();
        this.turnOrderToPlayerIdMapping = new Map();
        this.seatOrderToStateMapping = new Map();

        for (let i = 0; i < 9; i++) {
            this.seatOrderToStateMapping.set(i, {
                id: null,
                seatIndex: i,
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

        this.allowedActions = ['postblind'];

        this.pot = 0;
        this.playerCount = 0;
        this.largestBetSoFar = 0;
        this.totalRequiredToPlay = 0;

        this.minbet = {
            default: 10,
            current: 10,
        };
    }

    get players() {
        return [...this.seatOrderToStateMapping].filter(([k, v]) => v.id !== null);
    }

    get currentHandPhase() {
        return this.handPhase;
    }

    set currentHandPhase(hp) {
        this.handPhase = hp;
    }

    get currentBettingRound() {
        return this.bettingRound;
    }

    set currentBettingRound(i) {
        this.bettingRound = i;
    }

    get currentBetAnchor() {
        return this.betAnchor;
    }

    set currentBetAnchor(ba) {
        this.betAnchor = ba;
    }

    get smallBlind() {
        return [...this.seatOrderToStateMapping].find(([k, v]) => v.isSmallBlind)[1];
    }

    get bigBlind() {
        return [...this.seatOrderToStateMapping].find(([k, v]) => v.isBigBlind)[1];
    }

    get dealerButton() {
        return [...this.seatOrderToStateMapping].find(([k, v]) => v.isDealer)[1];
    }

    get actingPlayer() {
        return [...this.seatOrderToStateMapping].find(([k, v]) => v.isActingPlayer)[1];
    }

    getNextPlayerByPrevious(playerState) {
        return this.seatOrderToStateMapping.get(
            this.turnOrderToSeatOrderMapping.get(
                this.calcPrevFrom(playerState.betOrder)
            )
        )[1];
    }

    calcPrevFrom(i) {
        return ((i - 1) + this.playerCount) % this.playerCount;
    }

    calcNextFrom(i) {
        return (i + 1) % this.playerCount;
    }

    // getPlayerByTurnOrder(o) {
    //     return this.seatOrderToStateMapping.get(
    //         this.turnOrderToSeatOrderMapping.get(o)
    //     );
    // }

    determineBettingOrder(positions, buttonPosition) {
        this.playerCount = positions.length;

        for (let i = 0; i < this.playerCount; i++) {
            const betorder = (buttonPosition + (i + 1)) % this.playerCount;
            const seatindex = positions[i][1].seatindex;
            const id = positions[i][1].player.id;

            this.playerIdToSeatOrderMapping.set(id, seatindex);
            this.playerIdToBetOrderMapping.set(id, betorder);

            this.turnOrderToPlayerIdMapping.set(betorder, id);
            this.turnOrderToSeatOrderMapping.set(betorder, seatindex);

            const seat = this.seatOrderToStateMapping.get(seatindex);

            seat.id = id;
            seat.betOrder = betorder;
            seat.seatIndex = seatindex;

            if (betorder === 0) {
                seat.isSmallBlind = true;
            }

            if (betorder === 1) {
                seat.isBigBlind = true;
            }

            if (betorder === (this.playerCount - 1)) {
                seat.isDealer = true;
            }

            this.seatOrderToStateMapping.set(seatindex, seat);
        }
    }

    toggleActingPlayer(previous, next) {
        if (previous !== null) {
            const p = this.turnOrderToSeatOrderMapping.get(previous);
            this.seatOrderToStateMapping.get(p).isActingPlayer = false;
        }

        if (next !== null) {
            const n = this.turnOrderToSeatOrderMapping.get(next);
            this.seatOrderToStateMapping.get(n).isActingPlayer = true;
        }
    }

    handleBlind(fromPlayerId) {
        const so = this.playerIdToSeatOrderMapping.get(fromPlayerId);
        const state = this.seatOrderToStateMapping.get(so);

        let bet = this.minbet;

        if (state.isSmallBlind) {
            bet *= 0.5;
        }

        state.bet.history.push(this.minbet);
        state.hasActed = true;
        state.actingPlayer = false;

        this.seatOrderToStateMapping.set(so, state);

        // todo: notify ppl this happened?

        return this.calcNextFrom(
            this.playerIdToBetOrderMapping.get(
                fromPlayerId
            )
        )
    }

    handleBet(seatIndex, betAmount) {
        const current = this.seatOrderToStateMapping.get(seatIndex);

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