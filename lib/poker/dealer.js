// A betting round ends when two conditions are met:
// All players have had a chance to act.
// All players who haven't folded have bet the same amount of money for the round

const states = require('./states');

class Dealer {
    constructor() {
        this.dealerStates = new Map([
            [0, new states.StartState(0, 'start')],
            [1, new states.BlindState(1, 'blind')],
        ]);

        let i = 0;

        while (i < this.dealerStates.size - 1) {
            let c = this.dealerStates.get(i);

            if (!c.nextState) {
                c.nextState = this.dealerStates.get(i + 1);
            }

            i += 1;
        }

        console.log('\n');

        for (const [id, state] of this.dealerStates) {
            console.log(`state ${state.name} -> next ${state.nextState.name}`);
        }

        console.log('\n');

        this.stateHistoryIds = [];

        this.id = 0;

        this.betOrderIndexToSeatIndex = new Map();
        this.betOrderIndexToPlayerId = new Map();
        this.playerIdToBetOrderMapping = new Map();
        this.playerIdToSeatOrderMapping = new Map();
        this.playerStateTableBySeatIndex = new Map();

        for (let i = 0; i < 9; i++) {
            this.playerStateTableBySeatIndex.set(i, Dealer.createPlayer(i))
        }

        this.roundNameMap = [
            'start', 'blind', 'deal', 'flop', 'turn', 'river', 'showdown', 'end', 'invalid'
        ];

        this.roundStateTableById = new Map();

        for (let i = 0; i < this.roundNameMap.length; i++) {
            this.roundStateTableById.set(i, Dealer.createRound(i, this.roundNameMap[i]));
        }

        this.pot = null;

        this.potState = null;

        this.uuid = {
            next: -1,
            history: []
        };

        this.playerCount = 0;
        this.dealerInit = false;

        this.state = {
            players: new Map(),
            current: 'start',
            pot: {
                size: 0,
                bet: 0,
                blind: 0
            },
        };
    }


    // client sends:
    // - action
    // - current state
    // dealer validates:
    // - action
    // - player state
    // - game state 
    // if correct:
    // - dealer:
    // -- logs client action
    // -- updates the game state
    // -- does state need to change or send the sme?

    handlePlayerRequest(pid, betAmount, clientAction, clientRound) {
        const player = this.activePlayer;

        if (player.state.id !== pid) {
            Dealer.logActivePlayerSyncCorruption(player.state.id, pid);
        }

        const state = this.currentState;

        if (state.name !== clientRound) {
            Dealer.logActiveRoundSyncCorruption(state.name, clientRound);
        }

        this.uuuid.next += 1;

        const uuid = this.uuid.next;
        const betAction = Dealer.createBet(
            uuid, pid, clientAction, state.name, betAmount
        );

        const processedState = state.process(dealer, player, betAction);

        if (state.name !== processedState.name) {
            state.isActive = false;
            processedState.isActive = true;
        }
    }

    static newGameState(dealer) {
        return {
            pot: {
                size: 0,
                history: new Map()
            },
            round: {
                name: ''
            },
            bet: {
                last: 0
            }
        };
    }

    static handleBetAction(dealer, player, action) {
        const newState = {
            potSize: dealer.potSize + action.amount,
        }
    }

    get currentState() {
        return [...this.dealerStates].find(s => s[1].isActive)[1];
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
        return [...this.playerStateTableBySeatIndex].filter(([k, v]) => v.state.isValid);
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
        return [...this.playerStateTableBySeatIndex].find(([k, v]) => v.state.isAnchor)[1];
    }

    set betAnchor(a) {
        const cur = this.betAnchor;

        cur.state.isAnchor = false;
        a.state.isAnchor = true;

        this.playerStateTableBySeatIndex.set(cur.position.seatIndex, cur);
        this.playerStateTableBySeatIndex.set(a.position.seatIndex, a);
    }

    // set activePlayer(p) {
    //     const cur = this.activePlayer;

    //     if (!cur) {
    //         p.state.hasBetAction = true;
    //     } else {
    //         if (cur.state.id !== p.state.id) {
    //             cur.state.hasBetAction = false;
    //             p.state.hasBetAction = true;

    //             this.playerStateTableBySeatIndex.set(cur.position.seatIndex, cur);
    //         }
    //     }

    //     this.playerStateTableBySeatIndex.set(p.position.seatIndex, p);
    // }

    get activePlayer() {
        return [...this.playerStateTableBySeatIndex].find(([k, v]) => v.state.hasBetAction)[1];
    }

    set activeRoundState(r) {
        const cur = this.activeRoundState;

        if (cur.name !== r.name) {
            cur.isActive = false;
            cur.hasCompleted = true;
            r.isActive = true;
            r.hasCompleted = false;

            this.roundStateTableById.set(cur.id, cur);
            this.roundStateTableById.set(r.id, r);
        }
    }

    get activeRoundState() {
        return [...this.roundStateTableById].find(([k, v]) => v.isActive)[1];
    }

    get nextRoundState() {
        return this.roundStateTableById.get(this.activeRoundState.id + 1);
    }

    // passActionToPlayer(state) {
    //     if (!this.activePlayer) {
    //         state.state.hasBetAction = true;
    //     }
    // }

    // static toggleActivePlayer(cur, next) {
    //     if (cur) {
    //         cur.position.hasBetAction = false;
    //         if (next) {
    //             if (cur.state.id !== next.state.id) {
    //                 next.position.hasBetAction = true;
    //             }
    //         }
    //     } else if (next) {
    //         next.position.hasBetAction = true;
    //     }
    // }
    // getPlayerStateById(id) {
    //     return [...this.playerStateTableBySeatIndex].find(([k, v]) => v.state.id === id)[1];
    // }

    // getPlayerStateBySeatIndex(i) {
    //     return this.playerStateTableBySeatIndex.get(i);
    // }

    // getPlayerStateByBetOrderIndex(i) {
    //     return this.playerStateTableBySeatIndex.get(this.betOrderIndexToSeatIndex.get(i));
    // }

    // setPlayerStateBySeatIndex(i, s) {
    //     this.playerStateTableBySeatIndex.set(i, s);
    // }

    // setPlayerStateByBetOrderIndex(i, s) {
    //     this.playerStateTableBySeatIndex.set(this.betOrderIndexToSeatIndex.get(i), s);
    // }

    findActivePlayerByBetOrder(orderIndex, playersCounted, findBackwards) {
        if (playersCounted > this.playerCount) {
            return null;
        }

        let i = (orderIndex + 1) % this.playerCount;

        if (findBackwards) {
            i = ((orderIndex - 1) + this.playerCount) % this.playerCount;
        }

        const state = this.playerStateTableBySeatIndex.get(this.betOrderIndexToSeatIndex.get(i));

        if (state.state.hasFolded) {
            console.log(`${state.state.id} has folded, look for next`);
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

        this.pot = Dealer.createPot(
            options.maxRaiseCountPerRound || 3,
            options.blindSize || 10
        );

        this.roundStateTableById.get(0).isActive = true;

        for (let i = 0; i < this.playerCount; i++) {
            const betorder = (players.dealerPositionIndex + (i + 1)) % this.playerCount;
            const seatindex = players.positions[i][1].seatindex;
            const id = players.positions[i][1].state.id;

            this.playerIdToSeatOrderMapping.set(id, seatindex);
            this.playerIdToBetOrderMapping.set(id, betorder);

            this.betOrderIndexToPlayerId.set(betorder, id);
            this.betOrderIndexToSeatIndex.set(betorder, seatindex);

            const state = Dealer.createPlayer(seatindex);

            state.state.id = id;
            state.state.isValid = true;

            if (betorder === 0) {
                state.position.isSmallBlind = true;
            }

            if (betorder === 1) {
                state.position.isBigBlind = true;
            }

            if (betorder === (this.playerCount - 1)) {
                state.position.isDealer = true;
            }

            state.position.betOrder = betorder;

            this.playerStateTableBySeatIndex.set(seatindex, state);
        }

        // console.log(this.playerStateTableBySeatIndex);

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

    handlePlayerBet(pid, completedAction, roundName, betAmount) {
        const state = this.activePlayer;

        if (state.state.id !== pid) {
            Dealer.logActivePlayerSyncCorruption(state.state.id, pid);
        }

        const roundState = this.activeRoundState;

        if (roundState.name !== roundName) {
            Dealer.logActiveRoundSyncCorruption(roundState.name, roundName);
        }

        const actid = this.pot.nextAvailableActionId + 1;

        const playerBet = Dealer.createBet(
            actid,
            pid,
            completedAction,
            roundState.name,
            betAmount
        );

        roundState.actionHistory.current.set(actid, playerBet);

        this.pot.size += betAmount;
        this.pot.nextAvailableActionId = actid;
        this.pot.bets.history.set(actid, playerBet);

        state.bets.history.set(actid, playerBet);
        state.bets.potContribution += betAmount;

        if (state.state.isAnchor) {
            roundState.actionHistory.count += 1; // todo: deprecate? maybe not
        }

        if (!state.state.hasFolded) {
            if (playerBet.type === 'fold') {
                state.state.hasFolded = true;
            } else {
                let m = this.potBet;

                if (playerBet.amount > m) {
                    m = playerBet.amount;
                    this.betAnchor = state;
                }

                this.potBet = m;
            }
        }

        state.state.hasActedOnce = true;

        this.activeRoundState = roundState;
        this.playerStateTableBySeatIndex.set(state.position.seatIndex, state);

        return playerBet;
    }

    static morphPlayerState(player, action, bet) {
        let folded = action.type === 'fold' ? true : false;
        let b = bet.amount;

        if (!player.state.hasFolded && !folded) {

        }

        return {

        }
    }

    static handleStuff(dealer, player, action, bet, state) {
        const newState = {
            history: state.history,
            potSize: state.potSize + bet.amount,
            anchor: state.anchor,
            potBet: state.potBet
        };

        newState.history.set(action.id, { action: action, bet: bet });

        // roundState.actionHistory.current.set(actid, playerBet);

        // this.pot.size += betAmount;
        // this.pot.nextAvailableActionId = actid;
        // this.pot.bets.history.set(actid, playerBet);

        // state.bets.history.set(actid, playerBet);
        // state.bets.potContribution += betAmount;

        // if (player.state.isAnchor) {
        //     roundState.actionHistory.count += 1; // todo: deprecate? maybe not
        // }

        if (!player.state.hasFolded) {
            if (action.type === 'fold') {
                player.state.hasFolded = true;
            } else {
                let m = state.potBet;

                if (bet.amount > m) {
                    m = bet.amount;
                    // this.betAnchor = state;
                    newState.bettingAnchor = player.state.id;
                }

                state.potBet = m;
            }
        }

        state.state.hasActedOnce = true;

        this.activeRoundState = roundState;
        this.playerStateTableBySeatIndex.set(state.position.seatIndex, state);

        return playerBet;
    }

    updateRoundState(playerBet) {
        if (!playerBet) {
            return;
        }

        const state = this.activePlayer;

        if (state.state.id !== playerBet.bettingPlayerId) {
            Dealer.logActivePlayerSyncCorruption(state.state.id, playerBet.bettingPlayerId);
        }

        let roundState = this.activeRoundState;

        switch (roundState.name) {
            case 'start':
                roundState = this.nextRoundState;
                break;
            default:
                if (state.state.isAnchor && state.state.hasActedOnce) {
                    if (playerBet.type === 'check') {
                        roundState = this.nextRoundState;
                    }
                }
                break;
        }

        const logmsg = (this.activeRoundState.name === roundState.name ? 'no change' : 'switch to next state in cycle');

        Dealer.logRoundState(logmsg, roundState);

        this.activeRoundState = roundState;

        return this.activeRoundState;
    }

    updateGameState(player, betTarget) {
        if (!player) {
            return;
        }

        let roundState = this.activeRoundState;
        let logMsg = 'no change in round state';

        switch (roundState.name) {
            case 'start':
                roundState = this.nextRoundState;
                logMsg = 'next round is start';
                break;
            default:
                if (player.state.isAnchor && player.state.hasActedOnce) {
                    const result = Dealer.verifyPlayerPotContributions(this.allValidPlayerStates, betTarget);

                    if (!result) {
                        console.log("UM NOT ALL PLAYERS OWE 0");
                    }


                    let lastActionByPlayerActionId = 0;

                    for (const [id, a] of player.bets.history) {
                        if (id > lastActionByPlayerActionId) {
                            lastActionByPlayerActionId = id;
                        }
                    }

                    console.log("LAST ACT ID : " + lastActionByPlayerActionId);

                    const info = this.pot.bets.history.get(lastActionByPlayerActionId);

                    if (info.action.playerid === player.state.id) {
                        if (info.action.type === 'check') {
                            roundState = this.nextRoundState;
                            logMsg = 'going to the next round cus state checked'
                        } else {
                            logMsg = 'no change in round cause state did not check the bet';
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

        if (state.state.isAlive && !state.state.hasFolded) {
            const contributed = [...state.bets.history].reduce(([k, v], c) => v.amount + c);

            if (contributed !== s.bets.potContribution) {
                console.log(`check your maf ${contributed} vs ${s.bets.potContribution}\n`);
            }

            owes = target - (s.bets.potContribution > contributed ? contributed : s.bets.potContribution);
        }

        console.log(`calculating amount owed: ${state.state.id} ${owes}\n`);

        return owes;
    }

    getAllowedActionsForPlayer(player, requiredBet, roundName) {
        if (!player) {
            return [];
        }

        const roundState = this.activeRoundState;

        if (roundState.name !== roundName) {
            Dealer.logRoundState('err: got a different round name: ' + roundName, roundState);
        }

        if ((player.position.isBigBlind || player.position.isSmallBlind) && !player.state.hasActedOnce) {
            return ['postblind'];
        }

        const allowed = ['fold'];

        if (roundState.actionHistory.current.size === 0) {
            allowed.push('bet');
        }

        if (Dealer.calcAmountOwedByPlayer(player, requiredBet) <= 0) {
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

    static createPot(maxRaiseCountPerRound, blindSize) {
        return {
            size: 0,
            nextAvailableActionId: -1,
            maxRaiseCountPerRound: maxRaiseCountPerRound,
            bets: {
                blind: blindSize,
                min: blindSize * 0.5,
                history: new Map()
            }
        };
    }

    static createBet(id, pid, type, round, amount) {
        return {
            id: id,
            amount: amount,
            type: type,
            bettingPlayerId: pid,
            roundOccuredIn: round
        };
    }

    static createBetResult() {
        return {

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

    static createStateTransaction(bet) {
        return {

        };
    }

    static createPlayer(i) {
        return {
            state: {
                id: -1,
                isValid: false,
                isAnchor: false,
                hasHand: false,
                hasFolded: false,
                hasActedOnce: false,
                hasBetAction: false
            },
            position: {
                seatIndex: i,
                betOrder: null,
                isSmallBlind: false,
                isBigBlind: false,
                isDealer: false
            },
            bets: {
                history: new Map(),
                potContribution: 0,
                allowedActions: [],
            }
        };
    }

    static logPotState(msg, other) {
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
            `ERR: server and/or client state is corrupt -- mismatched acting state id\n
            active state on server ${serverId}\n
            active state on client ${clientId}`
        );
        console.log('===')
        console.log('*');
        console.log('\n');
    }
}

module.exports = Dealer;