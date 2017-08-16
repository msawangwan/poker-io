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

    set betAnchor(a) {
        const cur = this.betAnchor;

        cur.position.isAnchor = false;
        a.position.isAnchor = true;

        this.playerStateTableBySeatIndex.set(cur.position.seatIndex, cur);
        this.playerStateTableBySeatIndex.set(a.position.seatIndex, a);
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

        this.roundStateTableById.set(cur.id, cur);
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

            this.pot.bets.min = blindsize * 0.5;
            this.pot.bets.blind = blindsize;
            // this.pot.raiseRoundLimit = 3 * this.playerCount; // todo: paramaterize

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

        this.pot.raiseRoundLimit = 3 * this.playerCount; // todo: paramaterize. run in init
    }

    setPlayerStateAllowedActions(state, ...actions) {
        if (state) {
            state.bets.allowedActions = [];

            for (const a of actions) {
                state.bets.allowedActions.push(a);
            }

            this.playerStateTableBySeatIndex.set(state.position.seatIndex, state);

            return true;
        }

        return false;
    }

    processPlayerAction(playerState, completedAction, clientRound, betAmount) {
        const roundState = this.activeRound;

        if (roundState.name !== clientRound) {
            console.log(`err with round sync\nexpected ${roundState.name}\nsent ${clientRound}`);
        }

        const actid = this.pot.nextAvailableActionId + 1;
        const playerAction = Dealer.createPlayerAction(
            actid,
            playerState.player.id,
            completedAction,
            roundState.name,
            betAmount
        );

        roundState.actionHistory.current.set(actid, playerAction);

        playerState.bets.history.set(actid, playerAction);
        playerState.bets.potContribution += betAmount;

        this.pot.size += betAmount;
        this.pot.nextAvailableActionId = actid;
        this.pot.bets.history.set(actid, playerAction);

        if (playerState.position.isAnchor) {
            roundState.actionHistory.count += 1;
        }

        if (!playerState.player.hasFolded) {
            if (completedAction === 'fold') {
                playerState.player.hasFolded = true;
            } else {
                let m = this.pot.bets.min;

                if (betAmount > m) {
                    m = betAmount;
                    this.betAnchor = playerState;
                }

                this.pot.bets.min = m;
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
        let logMsg = 'no change in round state';

        switch (roundState.name) {
            case 'start':
                roundState = this.nextRound;
                logMsg = 'next round is start';
                break;
            default:
                if (playerState.position.isAnchor && playerState.player.hasActedOnce) {
                    const result = Dealer.verifyPlayerPotContributions(this.allValidPlayerStates, betTarget);

                    if (!result) {
                        console.log("UM NOT ALL PLAYERS OWE 0");
                        // break;
                    }

                    // const lastActionByPlayerActionId = playerState.actions.mostRecentActionId();

                    let lastActionByPlayerActionId = 0;

                    for (const [id, a] of playerState.bets.history) {
                        if (id > lastActionByPlayerActionId) {
                            lastActionByPlayerActionId = id;
                        }
                    }

                    const info = this.pot.bets.history.get(lastActionByPlayerActionId);

                    if (info.action.playerid === playerState.player.id) {
                        if (info.action.type === 'check') {
                            roundState = this.nextRound;
                            logMsg = 'going to the next round cus player checked'
                        } else {
                            logMsg = 'no change in round cause player did not check the bet';
                        }
                    } else {
                        logMsg = 'no change in round but mismatching ids?';
                    }
                }

                break;
        }

        Dealer.logRoundState(logMsg, roundState);

        this.activeRound = roundState;

        return this.activeRound;
    }

    static verifyPlayerPotContributions(states, target) {
        for (const [i, s] of states) {
            const owes = Dealer.calcAmountOwedByPlayer(s, target);

            if (owes <= 0) {
                continue;
            }

            return false;
        }

        return true;
    }

    static calcAmountOwedByPlayer(state, target) {
        let owes = 0;

        if (state.player.isAlive && !state.player.hasFolded) {
            const contributed = [...state.bets.history].reduce(([k, v], c) => v.amount + c);

            if (contributed !== s.bets.potContribution) {
                console.log(`check your maf ${contributed} vs ${s.bets.potContribution}\n`);
            }

            owes = target - (s.bets.potContribution > contributed ? contributed : s.bets.potContribution);
        }

        console.log(`calculating amount owed: ${state.player.id} ${owes}\n`);

        return owes;
    }

    getAllowedActionsForPlayer(playerState, requiredBet, roundName) {
        if (!playerState) {
            return [];
        }

        const roundState = this.activeRound;

        if (roundState.name !== roundName) {
            Dealer.logRoundState('err: got a different round name: ' + roundName, roundState);
        }

        if ((playerState.position.isBigBlind || playerState.position.isSmallBlind) && !playerState.player.hasActedOnce) {
            return ['postblind'];
        }

        const allowed = ['fold'];

        if (roundState.actionHistory.current.size === 0) {
            allowed.push('bet');
        }

        if (Dealer.calcAmountOwedByPlayer(playerState, requiredBet) <= 0) {
            allowed.push('check');
        } else {
            if (!allowed.includes('bet')) {
                allowed.push('call');
            }
        }

        if (roundState.actionHistory.count % this.pot.raiseRoundLimit === 0) {
            allowed.push('raise');
        }

        return allowed;
    }

    static createPot() {
        return {
            nextAvailableActionId: -1,
            size: 0,
            raiseRoundLimit: 0,
            bets: {
                blind: 0,
                min: 0,
                history: new Map()
            }
        };
    }

    static createRound(i, name) {
        return {
            id: i,
            name: name,
            isActive: false,
            hasCompleted: false,
            actionHistory: {
                count: 0,
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

    static createPlayerAction(aid, pid, action, round, amount) {
        return {
            id: aid,
            amount: amount,
            action: {
                playerid: pid,
                type: action,
                round: round
            }
        };
    }

    static logRoundState(msg, other) {
        console.log('*');
        console.log('===');
        console.log('**dealer log**');
        console.log('=');
        console.log(`round state: ${msg}`);
        console.log('=');
        console.log(other);
        console.log('=');
        console.log('===');
        console.log('*');
        console.log('\n');
    }

    static logPlayerState(msg, p) {
        console.log('*');
        console.log('===');
        console.log('**dealer log**');
        console.log('=');
        console.log(`player state: ${msg}`)
        console.log('=');
        console.log(p);
        console.log('=');
        console.log('===');
        console.log('*');
        console.log('\n');
    }
}

module.exports = Dealer;