class Dealer {
    constructor() {
        this.id = 0;

        this.playerIdToBetOrderMapping = new Map();
        this.playerIdToSeatOrderMapping = new Map();
        this.betOrderIndexToSeatIndex = new Map();
        this.betOrderIndexToPlayerId = new Map();
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

        this.playerStateTableBySeatIndex = new Map();

        for (let i = 0; i < 9; i++) {
            this.playerStateTableBySeatIndex.set(i, {
                isValid: false,
                isActingPlayer: false,
                hasActedOnce: false,
                hasFolded: false,
                player: {
                    id: null,
                    previous: null,
                    next: null
                },
                position: {
                    seatIndex: i,
                    betOrder: null,
                    isSmallBlind: false,
                    isBigBlind: false,
                    isDealer: false,
                    isAnchor: false
                },
                actions: {
                    betTotal: 0,
                    allowed: [],
                    historyIds: [],
                    owed: (min, total) => Math.abs(min - total),
                    lastActionId: (all) => all.length ? all[all.length - 1] : -1
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

    getRoundStateByName(r) {
        return this.rounds.get(this.getRoundIndexByName(r));
    }

    setRoundStateByName(r, updatedState) {
        this.rounds.set(this.getRoundIndexByName(r), updatedState);
    }

    toggleActiveRoundByName(cur) {
        if (cur !== 'start') {
            const active = this.getRoundStateByName(cur);

            active.isCurrentRound = false;

            this.setRoundStateByName(cur, active);
        }

        const nxt = this.getNextRoundNameFromCurrent(cur);
        const nextActive = this.getRoundStateByName(nxt);

        nextActive.isCurrentRound = true;

        this.setRoundStateByName(nxt, nextActive);
    }

    getPlayerStateBySeatIndex(i) {
        return this.playerStateTableBySeatIndex.get(i);
    }

    setPlayerStateBySeatIndex(i, s) {
        this.playerStateTableBySeatIndex.set(i, s);
    }

    getPlayerStateByBetOrderIndex(i) {
        return this.playerStateTableBySeatIndex.get(this.betOrderIndexToSeatIndex.get(i));
    }

    setPlayerStateByBetOrderIndex(i, s) {
        this.playerStateTableBySeatIndex.set(this.betOrderIndexToSeatIndex.get(i), s);
    }

    isValidPlayerState(s) {
        return s.isValid;
    }

    isValidPlayerStateAtIndex(i) {
        return this.getPlayerStateBySeatIndex(i).isValid;
    }

    getStateByPlayerId(pid) {
        return this.seatOrderToStateMapping.get(
            this.playerIdToSeatOrderMapping.get(pid)
        );
    }

    updatePlayerState(i, updatedPlayerState) {
        this.seatOrderToStateMapping.set(i, updatedPlayerState);
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

    findNextPlayerInHand(fromBetOrderIndex, playersCounted, behind) {
        if (playersCounted > this.playerCount) {
            return null;
        }

        const index = behind ?
            this.calcPrevFrom(fromBetOrderIndex) : this.calcNextFrom(fromBetOrderIndex);
        const state = this.getPlayerStateByBetOrderIndex(index);

        if (state.hasFolded) {
            return this.findNextPlayerInHand(index, playersCounted + 1, behind);
        } else {
            return state;
        }
    }

    linkPlayerStateNodes(playerState) {
        const curindex = playerState.position.betOrder;

        const prevState = this.findNextPlayerInHand(curindex, 0, true);
        const nextState = this.findNextPlayerInHand(curindex, 0, false);

        const logPrevIndex = prevState ? prevState.position.betOrder : 'none';
        const logNextIndex = nextState ? nextState.position.betOrder : 'none';

        console.log('linking player state nodes');
        console.log(`prev ${logPrevIndex} <- cur index ${curindex} -> next ${logNextIndex}`);

        playerState.player.previous = prevState;
        playerState.player.next = nextState;

        this.setPlayerStateByBetOrderIndex(curindex, playerState);

        return playerState;
        // let prevIndex = curindex;
        // let nextIndex = curindex;
        // let prevState = null;
        // let nextState = null;


        // while (true) {
        //     prevIndex = this.calcPrevFrom(prevIndex);
        //     prevState = this.getPlayerStateByBetOrderIndex(prevIndex);

        //     if (!prevState.hasFolded) {
        //         break;
        //     }

        //     prevIndex -= 1;
        // }

        // do {
        //     nextIndex = this.calcNextFrom(curindex);
        //     nextState = this.getPlayerStateByBetOrderIndex(nextIndex);
        // } while (nextState.hasFolded)
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

    determineSeatingAndInitPlayerStates(positions, buttonPosition) {
        this.playerCount = positions.length;

        for (let i = 0; i < this.playerCount; i++) {
            const betorder = (buttonPosition + (i + 1)) % this.playerCount;
            const seatindex = positions[i][1].seatindex;
            const id = positions[i][1].player.id;

            this.playerIdToSeatOrderMapping.set(id, seatindex);
            this.playerIdToBetOrderMapping.set(id, betorder);

            this.betOrderIndexToPlayerId.set(betorder, id);
            this.betOrderIndexToSeatIndex.set(betorder, seatindex);

            const state = this.getPlayerStateBySeatIndex(seatindex);

            state.isValid = true;
            state.player.id = id;
            state.position.betOrder = betorder;

            if (betorder === 0) {
                state.position.isSmallBlind = true;
            }

            if (betorder === 1) {
                state.position.isBigBlind = true;
                state.position.isAnchor = true;

                this.betAnchor.actionId = 1;
                this.betAnchor.state = state;
            }

            if (betorder === (this.playerCount - 1)) {
                state.position.isDealer = true;
            }

            this.setPlayerStateBySeatIndex(seatindex, state);
        }

        for (let i = 0; i < this.playerCount; i++) {
            const state = this.getPlayerStateBySeatIndex(i);

            if (!this.isValidPlayerState(state)) {
                continue;
            }

            this.linkPlayerStateNodes(state);
        }
    }

    determineBettingOrder(positions, buttonPosition) {
        this.playerCount = positions.length;

        for (let i = 0; i < this.playerCount; i++) {
            const betorder = (buttonPosition + (i + 1)) % this.playerCount;
            const seatindex = positions[i][1].seatindex;
            const id = positions[i][1].player.id;

            this.playerIdToSeatOrderMapping.set(id, seatindex);
            this.playerIdToBetOrderMapping.set(id, betorder);

            this.betOrderIndexToPlayerId.set(betorder, id);
            this.betOrderIndexToSeatIndex.set(betorder, seatindex);

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
            const p = this.betOrderIndexToSeatIndex.get(previous);
            this.seatOrderToStateMapping.get(p).isActingPlayer = false;
        }

        if (next !== null) {
            const n = this.betOrderIndexToSeatIndex.get(next);
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

    updatePlayerStateOnActionCompleted(playerState, completedAction, clientRound, betAmount) {
        const roundState = this.getRoundStateByName(clientRound);

        roundState.amountBetThisRound = roundState.amountBetThisRound + betAmount;
        this.pot = this.pot + betAmount;

        const actid = this.actionId + 1;

        this.actionHistory.push({ actionId: actid, actionAmount: betAmount, actionOwner: playerState.id });
        this.actionId = actid;

        playerState.bet.historyIds.push(actid);
        playerState.bet.total = playerState.bet.total + betAmount;
        playerState.hasActed = true;

        if (playerState.isBetAnchor) {
            roundState.numberOfBettingRounds = roundState.numberOfBettingRounds + 1;
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

        this.setRoundStateByName(round, roundState);
        this.setPlayerStateBySeatIndex(playerState.position.seatIndex, playerState);

        return playerState;
    }

    completeAction(playerid, action, round, amount) {
        this.pot += amount;

        const playerState = this.getStateByPlayerId(playerid);
        const roundState = this.getRoundStateByName(round);
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

        this.setRoundStateByName(round, roundState);

        return actid;
    }

    getAllowedActionsForPlayer(playerState, roundName) {
        const roundState = this.getRoundStateByName(roundName);

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