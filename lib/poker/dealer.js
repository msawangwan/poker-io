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
                    historyIds: [],
                    lastAction: (ids) => ids[ids.length - 1],
                    allowedActions: []
                }
            });
        }

        this.roundNameMap = [
            'blind', 'deal', 'flop', 'turn', 'river'
        ];

        this.rounds = new Map();

        for (let i = 0; i < 5; i++) {
            this.rounds.set(i, {
                id: i,
                name: this.roundNameMap[i],
                isCurrentRound: false,
                hasCompleted: false,
                amountBetThisRound: 0,
                numberOfBettingRounds: 0
            });
        }

        this.pot = 0;
        this.playerCount = 0;
        this.actionId = -1;
        this.dealerInit = false;

        this.actionHistory = [];

        this.betAnchor = {
            state: null,
            actionId: -1
        };
    }

    get players() {
        return [...this.seatOrderToStateMapping].filter(([k, v]) => v.id !== null);
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

    get haveAllPlayersBetOnce() {
        return [...this.seatOrderToStateMapping].every(([k, v]) => v.bet.hasActed);
    }

    get playersWhoOwe() {
        return [...this.seatOrderToStateMapping].filter(([k, v]) => v.bet.owed(this.minbet, v.bet.total) === 0);
    }

    get lastActionId() {
        return this.actionHistory ? this.actionHistory[this.actionHistory.length - 1].actionId : -1;
    }

    get activeRound() {
        return [...this.rounds].find(([k, v]) => v.isCurrentRound)[1];
    }

    getRoundNameById(id) {
        return this.roundNameMap[id];
    }

    getRoundIndexByName(n) {
        return this.roundNameMap.indexOf(n);
    }

    getNextRoundNameFromCurrent(r) {
        switch (r) {
            case 'start':
                return 'blind';
            case 'blind':
                return 'deal';
            case 'deal':
                return 'flop';
            case 'flop':
                return 'turn';
            case 'turn':
                return 'river';
            case 'river':
                return 'showdown';
            case 'showdown':
                return 'end';
            default:
                return 'invalid';
        }
    }

    getRoundState(r) {
        return this.rounds.get(this.getRoundIndexByName(r));
    }

    updateRoundState(r, updatedState) {
        this.rounds.set(this.getRoundIndexByName(r), updatedState);
    }

    toggleActiveRound(cur) {
        if (cur !== 'start') {
            const active = this.getRoundState(cur);

            active.isCurrentRound = false;

            this.updateRoundState(cur, active);
        }

        const nxt = this.getNextRoundNameFromCurrent(cur);
        const nextActive = this.getRoundState(nxt);

        nextActive.isCurrentRound = true;

        this.updateRoundState(nxt, nextActive);
    }

    getStateByPlayerId(pid) {
        return this.seatOrderToStateMapping.get(
            this.playerIdToSeatOrderMapping.get(pid)
        );
    }

    getStateLatestActionId(state) {
        return state.bet.lastAction(state.bet.historyIds);
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
            this.dealerInit = true;

            this.rounds.get(0).isCurrentRound = true;

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

                this.betAnchor.actionId = 1;
                this.betAnchor.state = seat;
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

        return this.completeAction(pid, 'postblind', 'blind', bet);
    }

    handleBetAnchorAction(action) {
        let proceedToNextRound = false;

        if (action === 'check') {
            proceedToNextRound = true;
        }

        return proceedToNextRound;
    }

    completeAction(playerid, action, round, amount) {
        this.pot += amount;

        const playerState = this.getStateByPlayerId(playerid);
        const roundState = this.getRoundState(round);
        const actid = this.actionId + 1;

        roundState.amountBetThisRound += amount;

        this.actionHistory.push({
            actionId: actid,
            actionAmount: amount
        });

        this.actionId = actid;

        playerState.bet.historyIds.push(actid);
        playerState.bet.total += amount;
        playerState.hasActed = true;

        if (playerState.isBetAnchor) {
            roundState.numberOfBettingRounds += 1;
        }

        if (!playerState.hasFolded) {
            if (action === 'fold') {
                playerState.hasFolded = true;
            } else {
                if (amount > this.minBet) {
                    this.minBet = amount;

                    playerState.isBetAnchor = true;

                    this.betAnchor.state = playerState;
                    this.betAnchor.actionId = actid;
                }
            }
        }

        this.updateRoundState(round, roundState);

        return actid;
    }

    getAllowedActionsForPlayer(playerState, roundName) {
        const roundState = this.getRoundState(roundName);

        if ((playerState.isBigBlind || playerState.isSmallBlind) && !playerState.hasActed) {
            return ['postblind'];
        }

        const allowed = ['fold'];

        if (roundState.amountBetThisRound <= 0) {
            allowed.push('bet');
        }

        if (playerState.bet.owed(this.minBet, playerState.bet.total) === 0) {
            allowed.push('check');
        } else {
            allowed.push('call');
        }

        if (this.activeRound.numberOfBettingRounds < 3) {
            allowed.push('raise');
        }

        return allowed;
    }
}

module.exports = Dealer;