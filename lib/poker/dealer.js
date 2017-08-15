class Dealer {
    constructor() {
        this.id = 0;

        this.dealerState = {
            blindsCollected: {
                small: false,
                big: false
            }
        };

        this.betOrderIndexToSeatIndex = new Map();
        this.betOrderIndexToPlayerId = new Map();
        this.playerIdToBetOrderMapping = new Map();
        this.playerIdToSeatOrderMapping = new Map();
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
            'start', 'blind', 'deal', 'flop', 'turn', 'river', 'showdown', 'end', 'invalid'
        ];

        this.rounds = new Map();

        for (let i = 0; i < this.roundNameMap.length; i++) {
            this.rounds.set(i, {
                id: i,
                name: this.roundNameMap[i],
                isCurrentRound: false,
                hasCompleted: false,
                actions: {
                    bets: {
                        thisRound: 0,
                        lastRound: 0,
                        total: (tr, lr) => tr + lr
                    },
                    count: 0
                }
            });
        }

        this.pot = {
            size: 0,
            history: []
        };

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
        return [...this.playerStateTableBySeatIndex].filter(([k, v]) => v.isValid);
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
        return [...this.playerStateTableBySeatIndex].find(([k, v]) => v.position.isSmallBlind)[1];
    }

    get bigBlind() {
        return [...this.playerStateTableBySeatIndex].find(([k, v]) => v.position.isBigBlind)[1];
    }

    get dealerButton() {
        return [...this.playerStateTableBySeatIndex].find(([k, v]) => v.position.isDealer)[1];
    }

    get betAnchorPlayer() {
        return [...this.playerStateTableBySeatIndex].find(([k, v]) => v.position.isAnchor)[1];
    }

    get currentBetAnchorPlayerId() {
        return this.betAnchor.state ? this.betAnchor.state.player.id : 'no anchor set';
    }

    get actingPlayerState() {
        return [...this.playerStateTableBySeatIndex].find(([k, v]) => v.isActingPlayer)[1];
    }

    get haveAllPlayersActedOnce() {
        return [...this.playerStateTableBySeatIndex].every(([k, v]) => v.hasActedOnce);
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

    getNextRoundStateFromCurrentRoundState(r) {
        switch (r.name) {
            case 'start':
                return this.rounds.get(this.roundNameMap.indexOf('blind'));
            case 'blind':
                return this.rounds.get(this.roundNameMap.indexOf('deal'));
            case 'deal':
                return this.rounds.get(this.roundNameMap.indexOf('flop'));
            case 'flop':
                return this.rounds.get(this.roundNameMap.indexOf('turn'));
            case 'turn':
                return this.rounds.get(this.roundNameMap.indexOf('river'));
            case 'river':
                return this.rounds.get(this.roundNameMap.indexOf('showdown'));
            case 'showdown':
                return this.rounds.get(this.roundNameMap.indexOf('end'));
            default:
                return this.rounds.get(this.roundNameMap.indexOf('invalid'));
        }
    }

    getRoundStateByName(r) {
        return this.rounds.get(this.getRoundIndexByName(r));
    }

    setRoundStateByName(r, updatedState) {
        this.rounds.set(this.getRoundIndexByName(r), updatedState);
    }

    markRoundActive(r) {
        if (r) {
            r.isCurrentRound = true;
            r.hasCompleted = false;
        }

        return r;
    }

    markRoundComplete(r) {
        if (r) {
            r.isCurrentRound = false;
            r.hasCompleted = true;
        }

        return r;
    }

    // DEPRECATE
    // cycleActiveRoundByName(cur) {
    //     if (cur !== 'start') {
    //         const active = this.getRoundStateByName(cur);

    //         active.isCurrentRound = false;

    //         this.setRoundStateByName(cur, active);
    //     }

    //     const nxt = this.getNextRoundNameFromCurrent(cur);
    //     const nextActive = this.getRoundStateByName(nxt);

    //     nextActive.isCurrentRound = true;

    //     this.setRoundStateByName(nxt, nextActive);
    // }

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

    isPlayerStateActingPlayer(s) {
        return s.player.id === this.actingPlayerState.player.id;
    }

    isPlayerByIdActingPlayer(id) {
        return id == this.actingPlayerState.player.id;
    }

    isPlayerStateValid(s) {
        return s.isValid;
    }

    isPlayerStateAtSeatIndexValid(i) {
        return this.getPlayerStateBySeatIndex(i).isValid;
    }

    calcPrevIndexFrom(i) {
        return ((i - 1) + this.playerCount) % this.playerCount;
    }

    calcNextIndexFrom(i) {
        return (i + 1) % this.playerCount;
    }

    validateTurnState(playerid, clientRound) {
        return this.actingPlayerState.player.id === playerid && this.activeRound.name === clientRound;
    }

    findNextPlayerInHandByBetOrderIndex(orderIndex, playersCounted, behind) {
        if (playersCounted > this.playerCount) {
            return null;
        }

        const i = behind ? this.calcPrevIndexFrom(orderIndex) : this.calcNextIndexFrom(orderIndex);
        const state = this.getPlayerStateByBetOrderIndex(i);

        if (state.hasFolded) {
            return this.findNextPlayerInHandByBetOrderIndex(i, playersCounted + 1, behind);
        } else {
            return state;
        }
    }

    linkPlayerStateNodes(playerState) {
        const curindex = playerState.position.betOrder;

        const prevState = this.findNextPlayerInHandByBetOrderIndex(curindex, 0, true);
        const nextState = this.findNextPlayerInHandByBetOrderIndex(curindex, 0, false);

        const logPrevIndex = prevState ? prevState.position.betOrder : 'none';
        const logNextIndex = nextState ? nextState.position.betOrder : 'none';

        console.log('linking player state nodes');
        console.log(`prev ${logPrevIndex} <- cur index ${curindex} -> next ${logNextIndex}`);

        playerState.player.previous = prevState;
        playerState.player.next = nextState;

        this.setPlayerStateByBetOrderIndex(curindex, playerState);

        return playerState;
    }

    initialise(blindsize) {
        if (!this.dealerInit) {
            this.dealerInit = true;

            this.minBet = blindsize;
            this.blindBetSize = blindsize;

            this.rounds.get(0).isCurrentRound = true;

            return true;
        }

        return false;
    }

    setupPlayerStates(positions, buttonPosition) {
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
                state.isActingPlayer = true;
            }

            if (betorder === 1) {
                state.position.isBigBlind = true;
            }

            if (betorder === (this.playerCount - 1)) {
                state.position.isDealer = true;
            }

            this.setPlayerStateBySeatIndex(seatindex, state);
        }

        for (let i = 0; i < this.playerCount; i++) {
            const state = this.getPlayerStateBySeatIndex(i);

            if (!this.isPlayerStateValid(state)) {
                continue;
            }

            this.linkPlayerStateNodes(state);
        }
    }

    setPlayerStateAllowedActions(state, ...actions) {
        if (state) {
            state.actions.allowed = [];
            for (const a of actions) {
                state.actions.allowed.push(a);
            }
        }
    }

    updatePlayerStateOnActionCompleted(playerState, completedAction, clientRound, betAmount) {
        const roundState = this.getRoundStateByName(clientRound);
        const actid = this.actionId + 1;

        roundState.actions.bets.thisRound += betAmount;

        this.pot.size = this.pot.size + betAmount;
        this.pot.history.push({
            amount: betAmount,
            better: playerState.player.id,
            total: this.pot.size,
            id: actid
        });

        this.actionHistory.push({ actionId: actid, actionAmount: betAmount, actionOwner: playerState.player.id });
        this.actionId = actid;

        playerState.actions.historyIds.push(actid);
        playerState.actions.betTotal += betAmount;

        if (playerState.position.isAnchor) {
            roundState.actions.count += 1;
        }

        if (!playerState.hasFolded) {
            if (completedAction === 'fold') {
                playerState.hasFolded = true;
            } else {
                if (betAmount > this.minBet) {
                    this.minBet = amount;

                    playerState.isBetAnchor = true;

                    this.betAnchor.state = playerState;
                    this.betAnchor.actionId = actid;
                }

                if (playerState.position.isSmallBlind) {
                    this.dealerState.blindsCollected.small = true;
                } else if (playerState.position.isBigBlind) {
                    this.dealerState.blindsCollected.big = true;
                }
            }
        }

        playerState.hasActed = true;
        playerState.isActingPlayer = false;

        this.setRoundStateByName(roundState.name, roundState);
        this.setPlayerStateBySeatIndex(playerState.position.seatIndex, playerState);

        return playerState;
    }

    // TODO: Left of here !!!
    updateRoundStateOnPlayerCompletedAction(playerState, roundName) {
        let cur = this.getRoundStateByName(roundName);
        let nxt = null;
        let update = false;

        switch (this.activeRound.name) {
            case 'start':
                update = true;
            case 'blind':
                if (this.dealerState.blindsCollected.small && this.dealerState.blindsCollected.big) {
                    update = true;
                }
                break;
            default:
                break;
        }

        if (update) {
            cur = this.markRoundComplete(cur);

            nxt = this.getNextRoundStateFromCurrentRoundState(cur);
            nxt = this.markRoundActive(nxt);

            const bets = cur.actions.bets;

            nxt.actions.bets.lastRound = cur.actions.bets.total(bets.thisRound, bets.lastRound);
        }

        return this.activeRound;
    }

    getAllowedActionsForPlayer(state, roundName) {
        const roundState = this.getRoundStateByName(roundName);

        if ((state.position.isBigBlind || state.position.isSmallBlind) && !state.hasActed) {
            return ['postblind'];
        }

        const allowed = ['fold'];

        if (roundState.actions.bets.thisRound <= 0) {
            allowed.push('bet');
        }

        if (state.actions.owed(this.minBet, state.actions.betTotal) === 0) {
            allowed.push('check');
        } else {
            allowed.push('call');
        }

        if (roundState.actions.count < 3) {
            allowed.push('raise');
        }

        return allowed;
    }
}

module.exports = Dealer;