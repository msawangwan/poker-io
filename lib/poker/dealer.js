class Dealer {
    constructor() {
        this.id = 0;

        this.betOrderIndexToSeatIndex = new Map();
        this.betOrderIndexToPlayerId = new Map();
        this.playerIdToBetOrderMapping = new Map();
        this.playerIdToSeatOrderMapping = new Map();
        this.playerStateTableBySeatIndex = new Map();

        for (let i = 0; i < 9; i++) {
            this.playerStateTableBySeatIndex.set(i, Dealer.createPlayer())
        }

        this.roundNameMap = [
            'start', 'blind', 'deal', 'flop', 'turn', 'river', 'showdown', 'end', 'invalid'
        ];

        this.roundStateTableById = new Map();

        for (let i = 0; i < this.roundNameMap.length; i++) {
            this.roundStateTableById.set(i, Dealer.createRound(i, this.roundNameMap[i]));
        }

        this.pot = Dealer.createPot();

        this.playerCount = 0;
        this.dealerInit = false;
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

    get allValidPlayerStates() {
        return [...this.playerStateTableBySeatIndex].filter(([k, v]) => v.player.isValid);
    }

    get allAlivePlayerStates() {
        return [...this.playerStateTableBySeatIndex].filter(([k, v]) => v.player.isAlive);
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

    get betAnchor() {
        return [...this.playerStateTableBySeatIndex].find(([k, v]) => v.position.isAnchor)[1];
    }

    get actingPlayerState() {
        return [...this.playerStateTableBySeatIndex].find(([k, v]) => v.player.hasBetAction)[1];
    }

    set activeRound(r) {
        const cur = this.activeRound;

        cur.isActive = false;
        cur.hasCompleted = true;
        r.isActive = true;
        r.hasCompleted = false;

        this.roundStateTableById.set(r.id, r);
    }

    get activeRound() {
        return [...this.roundStateTableById].find(([k, v]) => v.isActive)[1];
    }

    get nextRound() {
        return this.roundStateTableById.get(this.activeRound.id + 1);
    }

    getPlayerStateBySeatIndex(i) {
        return this.playerStateTableBySeatIndex.get(i);
    }

    getPlayerStateByBetOrderIndex(i) {
        return this.playerStateTableBySeatIndex.get(this.betOrderIndexToSeatIndex.get(i));
    }

    setPlayerStateBySeatIndex(i, s) {
        this.playerStateTableBySeatIndex.set(i, s);
    }

    setPlayerStateByBetOrderIndex(i, s) {
        this.playerStateTableBySeatIndex.set(this.betOrderIndexToSeatIndex.get(i), s);
    }

    validateClientState(playerid, clientRound) {
        return this.actingPlayerState.player.id === playerid && this.activeRound.name === clientRound;
    }

    findActivePlayerByBetOrder(orderIndex, playersCounted, findBackwards) {
        if (playersCounted > this.playerCount) {
            return null;
        }

        let i = (orderIndex + 1) % this.playerCount;

        if (findBackwards) {
            i = ((orderIndex - 1) + this.playerCount) % this.playerCount;
        }

        const state = this.getPlayerStateByBetOrderIndex(i);

        if (state.player.hasFolded) {
            console.log(`${state.player.id} has folded, look for next`);
            return this.findActivePlayerByBetOrder(i, playersCounted + 1, findBackwards);
        } else {
            return state;
        }
    }

    findNextActivePlayerInHand(cur, searchBackwards) {
        return this.findActivePlayerByBetOrder(cur.position.betOrder, 0, searchBackwards);
    }

    initialise(blindsize) {
        if (!this.dealerInit) {
            this.dealerInit = true;

            this.minBet = blindsize * 0.5;
            this.blindBetSize = blindsize;

            this.roundStateTableById.get(0).isActive = true;

            return true;
        }

        return false;
    }

    setPlayerStatesOnInit(positions, buttonPosition) {
        this.playerCount = positions.length;

        for (let i = 0; i < this.playerCount; i++) {
            const betorder = (buttonPosition + (i + 1)) % this.playerCount;
            const seatindex = positions[i][1].seatindex;
            const id = positions[i][1].player.id;

            this.playerIdToSeatOrderMapping.set(id, seatindex);
            this.playerIdToBetOrderMapping.set(id, betorder);

            this.betOrderIndexToPlayerId.set(betorder, id);
            this.betOrderIndexToSeatIndex.set(betorder, seatindex);

            const state = Dealer.createPlayer(seatindex);

            state.player.id = id;
            state.player.isValid = true;
            state.position.betOrder = betorder;

            if (betorder === 0) {
                state.position.isSmallBlind = true;
                state.position.isAlive = true;
                state.player.hasBetAction = true;
            }

            if (betorder === 1) {
                state.position.isBigBlind = true;
                state.position.isAlive = true;
                state.position.isAnchor = true;
            }

            if (betorder === (this.playerCount - 1)) {
                state.position.isDealer = true;
            }


            this.playerStateTableBySeatIndex.set(seatindex, state);
        }

        console.log(this.playerStateTableBySeatIndex);
    }

    setPlayerStatesOnRoundChange() {
        const states = this.allValidPlayerStates;

        for (const [i, s] of states) {
            if (s.player.hasFolded) {
                s.player.isValid = false;
                continue;
            }

            s.player.hasActedOnce = false;
            s.position.isAnchor = false;

            if (s.position.betOrder === 0) {
                s.player.hasBetAction = true;
            }

            if (s.position.isDealer) {
                s.position.isAnchor = true;
            }
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

    processPlayerAction(playerState, completedAction, clientRound, betAmount) {
        const roundState = this.activeRound;

        if (roundState.name !== clientRound) {
            console.log("WER HAVE PROBLEM WITH ROUNDS");
            console.log(`expected ${roundState.name}`);
            console.log(`sent ${clientRound}`);
        }

        const actid = this.pot.nextAvailableActionId + 1;

        const playerAction = Dealer.createPlayerAction(
            actid,
            playerState.player.id,
            completedAction,
            betAmount
        );

        // LEFT OFF HERE WITH REFACTORING

        roundState.actions.bets.current.set(actid, { id: actid, amount: betAmount });
        playerState.actions.bets.set({ id: actid, amount: betAmount });

        this.pot.size += betAmount;
        this.pot.history.set(actid, {
            id: actid,
            round: roundState.name,
            amount: betAmount,
            total: this.pot.size,
            better: {
                id: playerState.player.id,
                action: completedAction
            }
        });

        this.pot.lastActionId = actid;

        // playerState.actions.historyIds.push(actid);
        // playerState.actions.betTotal += betAmount;
        // playerState.actions.bets.set({ id: actid, amount: betAmount });

        if (playerState.position.isAnchor) {
            // roundState.actions.count += 1;
        }

        if (!playerState.player.hasFolded) {
            if (completedAction === 'fold') {
                playerState.player.hasFolded = true;
            } else {
                if (betAmount > this.minBet) {
                    this.minBet = betAmount;

                    const oldAnchor = this.betAnchor;

                    oldAnchor.position.betAnchor = false;
                    playerState.position.isAnchor = true;
                }
            }
        }

        playerState.player.hasActedOnce = true;
        playerState.player.hasBetAction = false;

        this.activeRound = roundState;
        this.setPlayerStateBySeatIndex(playerState.position.seatIndex, playerState);

        return playerState;
    }

    updateGameState(playerState, betTarget) {
        if (!playerState) {
            return;
        }

        let roundState = this.activeRound;

        switch (roundState.name) {
            case 'start':
                roundState = this.nextRound;

                console.log("GOT START ROUND SO GOING TO NEXT");
                console.log(`active: ${this.activeRound.name}`);
                console.log(`new active: ${roundState.name}`);

                break;
            default:
                if (playerState.position.isAnchor && playerState.player.hasActedOnce) {
                    const result = Dealer.verifyPlayerPotContributions(this.allValidPlayerStates, betTarget);

                    if (!result) {
                        console.log("UM NOT ALL PLAYERS OWE 0");
                        break;
                    }

                    // const actionInfo = this.potHistoryActionByPlayerState(playerState);
                    const lastActionByPlayerActionId = playerState.actions.mostRecentActionId();
                    const actionInfo = this.pot.history.get(lastActionByPlayerActionId);

                    if (actionInfo.better.id === playerState.player.id) {
                        if (actionInfo.better.action === 'check') {
                            roundState = this.nextRound;

                            console.log("GOT END OF ROUND SO GOING TO NEXT");
                            console.log(`active: ${this.activeRound.name}`);
                            console.log(`new active: ${roundState.name}`);
                        } else {
                            console.log("LAST ACT was " + actionInfo.better.action);
                            console.log("EXPECTED CHECK");
                        }
                    } else {
                        console.log("LAST ACT ID DOESNT MATCH THE STATE WE WAS GIVEN");
                        console.log("EXPECTED " + actionInfo.better.id);
                        console.log("GIVEN " + playerState.player.id);
                    }
                }

                break;
        }

        this.activeRound = roundState;

        return this.activeRound;
    }

    static verifyPlayerPotContributions(states, target) {
        console.log('verify player bets:');
        console.log('target: ' + target);

        for (const [i, s] of states) {
            if (!s.player.isAlive || s.player.hasFolded) {
                continue;
            }

            const owes = s.player.amountOwed(target);
            console.log(`checking: ${s.player.id} ${owes}`);

            if (owes >= 0) {
                console.log(`ok!`);
                continue;
            }

            console.log(`player owes: ${owes}`);

            return false;
        }

        return true;
    }

    getAllowedActionsForPlayer(playerState, requiredBet, roundName) {
        if (!playerState) {
            console.log("NO FRIGGIN P STATE DAMNIT");
            return [];
        }

        const roundState = this.activeRound;

        if (roundState.name !== roundName) {
            console.log("WER HAVE PROBLEM WITH ROUNDS");
            console.log(`expected ${roundState.name}`);
            console.log(`sent ${roundName}`);
        }

        if ((playerState.position.isBigBlind || playerState.position.isSmallBlind) && !playerState.player.hasActedOnce) {
            return ['postblind'];
        }

        const allowed = ['fold'];

        if (roundState.actions.bets.sumCurrent(true) <= 0) {
            // if (roundState.actions.bets.thisRound <= 0) {
            allowed.push('bet');
        }

        // const lastact = this.getLastActionCompleted().better.action;
        const lastact = this.pot.lastActionCompleted();

        if (playerState.actions.amountOwed(requiredBet) >= 0) {
            allowed.push('check');
        } else {
            if (!allowed.includes('bet')) {
                allowed.push('call');
            }
        }

        if (roundState.actions.count < 3) {
            allowed.push('raise');
        }


        return allowed;
    }

    static createRound(i, name) {
        return {
            id: i,
            name: name,
            isActive: false,
            hasCompleted: false,
            actionHistory: {
                current: new Map(),
                all: new Map()
            }
        };
    }

    static createPlayer(i) {
        return {
            player: {
                id: null,
                isValid: false,
                isAlive: false,
                hasHand: false,
                hasFolded: false,
                hasActedOnce: false,
                hasBetAction: false,
            },
            position: {
                seatIndex: i,
                betOrder: null,
                isSmallBlind: false,
                isBigBlind: false,
                isDealer: false,
                isAnchor: false
            },
            bets: {
                history: new Map(),
                potContribution: 0,
                allowedActions: [],
            }
        };
    }

    static createPlayerAction(actid, playerid, type, amount) {
        return {
            id: actionId,
            type: type,
            amount: amount,
            ownerId: playerid
        }
    }

    static createPot() {
        return {
            size: 0,
            nextAvailableActionId: -1,
            betHistory: new Map()
        };
    }

    static createPotAction(id, round, potsize, action) {
        return {
            id: id,
            round: round,
            size: potsize,
            bet: {
                playerid: action.ownerId,
                action: action.type,
                amount: action.amount
            }
        }
    }
}

module.exports = Dealer;