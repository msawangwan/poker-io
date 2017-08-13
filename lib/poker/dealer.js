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
                isBetAnchor: false,
                bet: {
                    total: 0,
                    history: [],
                    allowedActions: []
                }
            });
        }

        this.pot = 0;
        this.playerCount = 0;
        this.totalRequiredToPlay = 0;
        this.dealerInit = false;
        // this.largestBetSoFar = 0;
        // this.blindSize = 10;
        // this.blindBetSize = 10;
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

    get blindBetSize() {
        return this.blinds;
    }

    set blindBetSize(n) {
        this.blinds = n;
    }

    get minBet() {
        return this.largestBetSoFar;
    }

    set minBet(n) {
        this.largestBetSoFar = n;
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

    get betAnchorPlayer() {
        return [...this.seatOrderToStateMapping].find(([k, v]) => v.isBetAnchor)[1];
    }

    calcPrevFrom(i) {
        return ((i - 1) + this.playerCount) % this.playerCount;
    }

    calcNextFrom(i) {
        return (i + 1) % this.playerCount;
    }

    nextOrderIndex(id) {
        return this.calcNextFrom(
            this.playerIdToBetOrderMapping.get(id)
        );
    }

    oneTimeInit(blindsize) {
        if (!this.dealerInit) {
            this.blindBetSize = blindsize;
            this.minBet = blindsize;
            this.currentHandPhase = 'blind';
            this.currentBettingRound = 0;
            this.dealerInit = true;

            return true;
        }

        return false;
    }

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
                seat.isBetAnchor = true;
            }

            if (betorder === (this.playerCount - 1)) {
                seat.isDealer = true;
            }

            this.seatOrderToStateMapping.set(seatindex, seat);
        }
    }

    toggleActingPlayer(previous, next) {
        console.log("TOGGLING ACTING PLAYER");
        console.log("PREVIOUS " + previous);
        console.log("NEXT " + next);
        if (previous !== null) {
            const p = this.turnOrderToSeatOrderMapping.get(previous);
            this.seatOrderToStateMapping.get(p).isActingPlayer = false;
        }

        if (next !== null) {
            const n = this.turnOrderToSeatOrderMapping.get(next);
            this.seatOrderToStateMapping.get(n).isActingPlayer = true;
        }

        return this.actingPlayer;
    }

    setAllowedActions(pid, clear, ...actions) {
        const so = this.playerIdToSeatOrderMapping.get(pid);
        const state = this.seatOrderToStateMapping.get(so);

        if (clear) {
            state.bet.allowedActions = [];
        }

        for (const a of actions) {
            state.bet.allowedActions.push(a);
        }
    }

    handleBlind(pid) {
        const so = this.playerIdToSeatOrderMapping.get(pid);
        const state = this.seatOrderToStateMapping.get(so);

        let bet = this.blindBetSize;
        let nextPlayerAllowedActions = [];

        if (state.isSmallBlind) {
            bet *= 0.5;
            nextPlayerAllowedActions.push('postblind');
        } else {
            nextPlayerAllowedActions.push('call', 'bet', 'raise', 'fold');
        }

        state.bet.history.push(bet);

        if (bet > this.minBet) {
            this.minBet = bet;
            this.currentBetAnchor = state.id;
        }

        this.seatOrderToStateMapping.set(so, state);

        // return this.calcNextFrom(
        //     this.playerIdToBetOrderMapping.get(
        //         pid
        //     )
        // );
        return nextPlayerAllowedActions;
    }

    handleBet(pid, betAmount) {
        const so = this.playerIdToSeatOrderMapping.get(pid);
        const current = this.seatOrderToStateMapping.get(so);
        const nextPlayerAllowedActions = ['fold'];

        if (current.hasFolded) {
            // return 0;
            return nextPlayerAllowedActions;
        }

        current.bet.total += betAmount;

        if (betAmount > this.minBet) {
            this.minBet = betAmount;
            this.currentBetAnchor = current.id;
        }

        current.bet.history.push(betAmount);

        // return this.calcNextFrom(
        //     this.playerIdToBetOrderMapping.get(
        //         pid
        //     )
        // );

        nextPlayerAllowedActions.push('call', 'bet', 'raise');

        return nextPlayerAllowedActions;
    }
}

module.exports = Dealer;