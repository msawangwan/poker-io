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
                    owed: (minbet, contributed) => Math.abs(minbet - contributed),
                    history: [],
                    allowedActions: []
                }
            });
        }

        this.phaseMap = [
            'blind', 'deal', 'flop', 'turn', 'river'
        ];

        this.phase = new Map();

        for (let i = 0; i < 5; i++) {
            this.phase.set(i, {
                aPlayerHasBet: false,
                numberOfBettingRounds: 0
            });
        }

        this.pot = 0;
        this.playerCount = 0;
        this.totalRequiredToPlay = 0;
        this.dealerInit = false;
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

        if (state.isSmallBlind) {
            bet *= 0.5;
        }

        this.handleBet(pid, bet, 'postblind', 'blind');
    }

    handleBet(pid, betAmount, action, phase) {
        const so = this.playerIdToSeatOrderMapping.get(pid);
        const current = this.seatOrderToStateMapping.get(so);

        current.hasActed = true;

        if (current.hasFolded) {
            return false;
        }

        if (action === 'fold') {
            current.hasFolded = true;
        } else {
            if (action !== 'check') {
                current.bet.history.push(betAmount);
                current.bet.total += betAmount;
                // current.bet.owed = Math.abs(current.bet.total - this.minBet);

                if (betAmount > this.minBet) {
                    this.minBet = betAmount;
                    this.currentBetAnchor = current.id;
                }

                const key = this.phaseMap.indexOf(phase);

                if (!this.phase.get(key).aPlayerHasBet) {
                    this.phase.get(key).aPlayerHasBet = true;
                }
            }
        }

        return true;
    }

    getAllowedActionsForPlayer(state, phase) {
        if ((state.isBigBlind || state.isSmallBlind) && !state.hasActed) {
            return ['postblind'];
        }

        const allowed = ['fold'];

        if (state.bet.owed !== 0) {
            allowed.push('call');
        } else {
            allowed.push('check');
        }

        const key = this.phaseMap.indexOf(phase);

        if (!this.phase.get(key).aPlayerHasBet) {
            allowed.push('bet');
        }

        if (this.currentBettingRound < 3 && !state.isBetAnchor) {
            allowed.push('raise');
        }

        return allowed;
    }
}

module.exports = Dealer;