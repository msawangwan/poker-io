// A betting round ends when two conditions are met:
// All players have had a chance to act.
// All players who haven't folded have bet the same amount of money for the round

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

    get blindBet() {
        return this.pot.bets.blind;
    }

    get potBet() {
        return this.pot.bets.min;
    }
    
    set potBet(b) {
        this.pot.bets.min = b;
    }

    get potSize() {
        return this.pot.bets.size;
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

    get activePlayerState() {
        return [...this.playerStateTableBySeatIndex].find(([k, v]) => v.player.hasBetAction)[1];
    }

    set activeRoundState(r) {
        const cur = this.activeRoundState;

        cur.isActive = false;
        cur.hasCompleted = true;
        r.isActive = true;
        r.hasCompleted = false;

        this.roundStateTableById.set(cur.id, cur);
        this.roundStateTableById.set(r.id, r);
    }

    get activeRoundState() {
        return [...this.roundStateTableById].find(([k, v]) => v.isActive)[1];
    }

    get nextRound() {
        return this.roundStateTableById.get(this.activeRoundState.id + 1);
    }

    getPlayerStateById(id) {
        return [...this.playerStateTableBySeatIndex].find(([k, v]) => v.player.id === id)[1];
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

    initialise(players, options) {
        if (this.dealerInit) {
            return false;
        }

        this.dealerInit = true;

        this.playerCount = players.positions.length;

        this.pot.bets.blind = options.blindSize || 10;
        this.pot.bets.min = this.pot.bets.blind * 0.5;
        this.pot.maxRaiseCountPerRound = options.maxRaiseCountPerRound || 3;

        this.roundStateTableById.get(0).isActive = true;

        for (let i = 0; i < this.playerCount; i++) {
            const betorder = (players.dealerPositionIndex + (i + 1)) % this.playerCount;
            const seatindex = players.positions[i][1].seatindex;
            const id = players.positions[i][1].player.id;

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

        return true;
    }

    static updateAllowedActionsForPlayer(state, ...actions) {
        if (!state) {
            return null;
        }

        state.bets.allowedActions = [];

        for (const a of actions) {
            state.bets.allowedActions.push(a);
        }

        return state;
    }

    completePlayerAction(pid, completedAction, roundName, betAmount) {
        const actingPlayerId = this.activePlayerState.player.id;

        if (actingPlayerId !== pid) {
            Dealer.logActivePlayerSyncCorruption(actingPlayerId, pid);
        }

        const roundState = this.activeRoundState;

        if (roundState.name !== roundName) {
            Dealer.logActiveRoundSyncCorruption(roundState.name, roundName);
        }

        const actid = this.pot.nextAvailableActionId + 1;

        const playerAction = Dealer.createPlayerAction(
            actid,
            pid,
            completedAction,
            roundState.name,
            betAmount
        );

        roundState.actionHistory.current.set(actid, playerAction);

        const state = this.getPlayerStateById(pid);

        state.bets.history.set(actid, playerAction);
        state.bets.potContribution += betAmount;

        this.pot.size += betAmount;
        this.pot.nextAvailableActionId = actid;
        this.pot.bets.history.set(actid, playerAction);

        return playerAction;
    }

    updatePlayerState(playerAction) {
        if (!playerAction) {
            return null;
        }

        const pid = playerAction.action.playerid;
        const state = this.activePlayerState;

        if (state.player.id !== pid) {
            Dealer.logActivePlayerSyncCorruption(state.player.id, pid);
        }

        const roundState = this.activeRoundState;

        if (state.position.isAnchor) {
            roundState.actionHistory.count += 1; // todo: deprecate? maybe not
        }

        if (!state.player.hasFolded) {
            if (playerAction.action.type === 'fold') {
                state.player.hasFolded = true;
            } else {
                let m = this.potBet;

                if (playerAction.amount > m) {
                    m = playerAction.amount;
                    this.betAnchor = state;
                }

                this.potBet = m;
            }
        }

        state.player.hasActedOnce = true;
        state.player.hasBetAction = false;

        this.activeRoundState = roundState;
        this.setPlayerStateBySeatIndex(state.position.seatIndex, state);

        return state;
    }

    updateGameState(playerState, betTarget) {
        if (!playerState) {
            return;
        }

        let roundState = this.activeRoundState;
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
                    }


                    let lastActionByPlayerActionId = 0;

                    for (const [id, a] of playerState.bets.history) {
                        if (id > lastActionByPlayerActionId) {
                            lastActionByPlayerActionId = id;
                        }
                    }

                    console.log("LAST ACT ID : " + lastActionByPlayerActionId);

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

        this.activeRoundState = roundState;

        return this.activeRoundState;
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

        const roundState = this.activeRoundState;

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

        if (roundState.actionHistory.count - this.pot.maxRaiseCountPerRound === 0) {
            allowed.push('raise');
        }

        return allowed;
    }

    static createPot() {
        return {
            nextAvailableActionId: -1,
            size: 0,
            maxRaiseCountPerRound: 0,
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
    
    static logPotState(msg , other) {
        console.log('*');
        console.log('===');
        console.log('**dealer log**');
        console.log('=');
        console.log(`pot state: ${msg}`);
        console.log('=');
        console.log(other);
        console.log('=');
        console.log('===');
        console.log('*');
        console.log('\n');
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
    
    static logActiveRoundSyncCorruption(serverStateName, clientStateName) {
        console.log('*');
        console.log('===');
        console.log(
            `ERR: server and/or client state is corrupt -- round sync corruption\n
            active round on server ${serverStateName}\n
            active round on client ${clientStateName}`
        );
        console.log('*');
        console.log('===');
        console.log('\n');
    }

    static logActivePlayerSyncCorruption(serverId, clientId) {
        console.log('*');
        console.log('===')
        console.log(
            `ERR: server and/or client state is corrupt -- mismatched acting player id\n
            active player on server ${serverId}\n
            active player on client ${clientId}`
        );
        console.log('===')
        console.log('*');
        console.log('\n');
    }
}

module.exports = Dealer;