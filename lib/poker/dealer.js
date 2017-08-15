class Dealer {
    constructor() {
        this.id = 0;

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
                    id: null
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
            lastActionId: -1,
            history: new Map()
        };

        this.playerCount = 0;
        // this.lastActionId = -1;
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
        return [...this.playerStateTableBySeatIndex].filter(([k, v]) => v.isValid);
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
        return [...this.playerStateTableBySeatIndex].find(([k, v]) => v.isActingPlayer)[1];
    }

    get haveAllPlayersActedOnce() {
        return [...this.playerStateTableBySeatIndex].every(([k, v]) => v.hasActedOnce);
    }

    set activeRound(r) {
        const cur = this.activeRound;

        cur.isCurrentRound = false;
        cur.hasCompleted = true;
        r.isCurrentRound = true;
        r.hasCompleted = false;

        this.rounds.set(r.id, r);
    }

    get activeRound() {
        return [...this.rounds].find(([k, v]) => v.isCurrentRound)[1];
    }

    get nextRound() {
        return this.rounds.get(this.activeRound.id + 1);
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

        if (state.hasFolded) {
            return this.findActivePlayerByBetOrder(i, playersCounted + 1, findBackwards);
        } else {
            return state;
        }
    }

    findNextActivePlayerInHand(cur, searchBackwards) {
        return this.findActivePlayerByBetOrder(cur.position.betOrder, this.playerCount, searchBackwards);
    }

    validateClientState(playerid, clientRound) {
        return this.actingPlayerState.player.id === playerid && this.activeRound.name === clientRound;
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
                state.position.isAnchor = true;
            }

            if (betorder === (this.playerCount - 1)) {
                state.position.isDealer = true;
            }

            this.setPlayerStateBySeatIndex(seatindex, state);
        }

        {
            console.log('player state init complete:');
            console.log(this.allValidPlayerStates);
            console.log('\n');
        }
    }

    setPlayerStatesOnRoundChange() {
        const states = this.allValidPlayerStates;

        for (const [i, s] of states) {
            if (s.hasFolded) {
                s.isValid = false;
                continue;
            }

            s.hasActedOnce = false;
            s.position.isAnchor = false;

            if (s.position.betOrder === 0) {
                s.isActingPlayer = true;
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

    getLastActionCompletedByPlayerState(playerState) {
        return this.pot.history.get(
            playerState.actions.lastActionId(playerState.actions.historyIds)
        );
    }

    getLastActionCompleted() {
        return this.pot.lastActionId > 0 ? this.pot.history.get(this.pot.lastActionId) : null;
    }

    processPlayerAction(playerState, completedAction, clientRound, betAmount) {
        const roundState = this.activeRound;

        if (roundState.name !== clientRound) {
            console.log("WER HAVE PROBLEM WITH ROUNDS");
            console.log(`expected ${roundState.name}`);
            console.log(`sent ${clientRound}`);
        }

        // const actid = this.lastActionId + 1;
        const actid = this.pot.lastActionId + 1;

        roundState.actions.bets.thisRound += betAmount;

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
        // this.lastActionId = actid;

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
                    this.minBet = betAmount;

                    const oldAnchor = this.betAnchor;

                    oldAnchor.position.betAnchor = false;
                    playerState.position.isAnchor = true;
                }
            }
        }

        playerState.hasActedOnce = true;
        playerState.isActingPlayer = false;

        this.activeRound = roundState;
        this.setPlayerStateBySeatIndex(playerState.position.seatIndex, playerState);

        return playerState;
    }

    updateGameState(playerState) {
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
                if (playerState.position.isAnchor && playerState.hasActedOnce) {
                    if (!this.verifyAllPlayersInHandOweZero()) {
                        console.log("UM NOT ALL PLAYERS OWE 0");
                    }

                    const lastact = this.getLastActionCompletedByPlayerState(playerState);
                    // const lastactid = playerState.actions.lastActionId(playerState.actions.historyIds);
                    // const lastact = this.pot.history.get(lastactid);

                    if (lastact.better.id === playerState.player.id) {
                        if (lastact.better.action === 'check') {
                            roundState = this.nextRound;

                            console.log("GOT END OF ROUND SO GOING TO NEXT");
                            console.log(`active: ${this.activeRound.name}`);
                            console.log(`new active: ${roundState.name}`);
                        } else {
                            console.log("LAST ACT was " + lastact.better.action);
                            console.log("EXPECTED CHECK");
                        }
                    } else {
                        console.log("LAST ACT ID DOESNT MATCH THE STATE WE WAS GIVEN");
                        console.log("EXPECTED " + lastact.better.id);
                        console.log("GIVEN " + playerState.player.id);
                    }
                }

                break;
        }

        this.activeRound = roundState;

        return this.activeRound;
    }

    verifyAllPlayersInHandOweZero() {
        const states = this.allValidPlayerStates;

        console.log("VERIFY ALL PLAYERS OWE 0");

        for (const [i, s] of states) {
            const owes = s.actions.owed(this.minBet, s.actions.betTotal);

            console.log(`PLAYER ${s.player.id} OWES ${owes}`);

            if (s.hasFolded || owes === 0) {
                continue;
            }


            return false;
        }

        return true;
    }

    getAllowedActionsForPlayer(playerState, roundName) {
        const roundState = this.activeRound;

        if (roundState.name !== roundName) {
            console.log("WER HAVE PROBLEM WITH ROUNDS");
            console.log(`expected ${roundState.name}`);
            console.log(`sent ${roundName}`);
        }

        if ((playerState.position.isBigBlind || playerState.position.isSmallBlind) && !playerState.hasActedOnce) {
            return ['postblind'];
        }

        const allowed = ['fold'];

        if (roundState.actions.bets.thisRound <= 0) {
            allowed.push('bet');
        }

        const lastact = this.getLastActionCompleted().better.action;

        if (playerState.actions.owed(this.minBet, playerState.actions.betTotal) === 0) {
            allowed.push('check');
        } else {
            if (lastact === 'call' || lastact === 'bet' || lastact === 'raise') {
                allowed.push('call');
            }
        }

        if (roundState.actions.count < 3) {
            allowed.push('raise');
        }


        return allowed;
    }
}

module.exports = Dealer;