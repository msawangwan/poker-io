const Game = require('./game');
const EventEmitter = require('events');

const shared = {
    lastid: -1,
    emptyname: '[...]'
};

const tablestate = {
    waitingForPlayers: 'waitingForPlayers',
    dealInPlay: 'dealInPlay'
};

class TableEvent extends EventEmitter { }

class Table {
    constructor(numberOfSeats, socketconn, banker) {
        this.id = shared.lastid + 1;

        this.maxseats = numberOfSeats;
        this.startThreshold = 3;

        this.games = new Map();
        this.seats = new Map();
        this.players = new Map();
        this.names = new Map();

        this.button = {
            position: 1 // TODO: this should incr when a game completes!
        };

        this.socketconn = socketconn;
        this.banker = banker;

        this.state = tablestate.waitingForPlayers;

        for (let i = 0; i < this.maxseats; i++) {
            this.seats.set(i, Table.seat(-1, `${shared.emptyname}`, 0, true, -1));
        }

        this.tableEvent = new TableEvent();

        this.tableEvent.on('player-joined', (name, id, onjoinhandler) => {
            const assignedSeat = this.firstAvailableSeatIndex;

            this.seats.set(assignedSeat, Table.seat(id, name, this.banker.getBalance(id), false, assignedSeat, assignedSeat));
            this.players.set(id, assignedSeat);
            this.names.set(id, name);

            onjoinhandler(name, this.id, assignedSeat, this.seatingState, () => {
                if (this.vacancyCount(false) > this.startThreshold) {
                    if (this.state === tablestate.waitingForPlayers) {
                        this.state = tablestate.dealInPlay;

                        const players = this.vacancies(false);
                        const gameId = this.gameCount;

                        const game = new Game(gameId, players, this.button.position);

                        game.gameEvent.on(
                            'pass-action-to-player',
                            (round, seat, order, pid, acted, potsize, minbet, actions) => {
                                this.socketconn.to(pid).emit('pass-action-to-player', {
                                    round: round,
                                    seat: seat,
                                    order: order,
                                    acted: acted,
                                    potsize: potsize,
                                    minbet: minbet,
                                    actions: actions
                                });
                            }
                        );

                        game.gameEvent.on('collect-blind', (blindPlayerById, blindType, blindBetSize) => {
                            this.socketconn.to(blindPlayerById).emit('collect-blind', {
                                blindType: blindType,
                                blindBetSize: blindBetSize
                            });
                        });

                        game.gameEvent.on('collect-ante', (antePlayerById, allowedActions, anteSize) => {
                            this.socketconn.to(antePlayerById).emit('collect-ante', {
                                allowedActions: allowedActions,
                                minBetAmount: anteSize
                            });
                        });

                        game.gameEvent.on('collect-flop', (utgById, actionType, minBetAmount) => {
                            console.log("TODO: SEND COLLECT FLOP TO PLAYER " + utgById);
                        });

                        game.gameEvent.on('deal-holecards', (utgById, minBetAmount, dealtCards) => {
                            for (const [id, i] of this.players) {
                                this.socketconn.to(id).emit('player-dealt-cards', { a: dealtCards.get(id).a, b: dealtCards.get(id).b });  // emit as action?
                            }

                            this.socketconn.to(utgById).emit('collect-ante', {
                                allowedActions: ['call', 'raise', 'fold'],
                                minBetAmount: minBetAmount
                            });
                        });

                        game.gameEvent.on('deal-flop', (minBetAmount, flopped) => {
                            this.socketconn.in(this.roomId).emit('flop-dealt', {
                                utg: 0, a: flopped.get(0), b: flopped.get(1), c: flopped.get(2)
                            });
                        });

                        this.games.set(gameId, game);

                        game.gameEvent.emit('game-start', (playerid, gameid) => { // this is sent to each player individually
                            this.socketconn.to(playerid).emit('game-started', {
                                gameId: gameId,
                                buttonIndex: game.buttonPosition
                            });
                        });
                    }
                }
            });
        });

        this.tableEvent.on('poll-game-state', (playerid, gameid) => {
            const game = this.games.get(gameid);

            game.gameEvent.emit('poll-game-state', (seat, name, id, type, circulated, pot, clear) => {
                this.socketconn.to(playerid).emit('game-state', {
                    actionOn: {
                        seat: seat,
                        player: {
                            name: name,
                            id: id,
                        }
                    },
                    round: {
                        type: type,
                        circulations: circulated
                    },
                    potsize: pot,
                    clearTable: clear
                });
            })

        });

        this.tableEvent.on('player-completed-action', (id, round, type, order, amount, gameid) => {
            this.games.get(gameid).playerCompletedAction(id, round, type, order, amount);
        });

        this.tableEvent.on('post-blind', (playerid, gameid, blindType, blindAmount) => {
            const game = this.games.get(gameid);
            const seat = this.players.get(playerid);

            let balance = this.banker.getBalance(playerid);

            if (balance < blindAmount) { /* err */ }

            this.banker.setBalance(playerid, balance - blindAmount);

            game.gameEvent.emit(
                'player-posted-blind',
                playerid,
                blindType,
                blindAmount,
                (pid, bet, pot, clear) => {
                    this.socketconn.in(this.roomId).emit('table-state', {
                        playerName: this.names.get(pid),
                        playerId: pid,
                        playerSeat: this.players.get(pid),
                        updatedBalance: this.banker.getBalance(pid),
                        betAmount: bet,
                        potsize: pot,
                        clearTable: clear
                    });
                }
            );
        });

        this.tableEvent.on('post-ante', (playerid, gameid, betType, betAmount) => {
            const game = this.games.get(gameid);
            const seat = this.players.get(playerid);

            let balance = this.banker.getBalance(playerid);

            if (balance < betAmount) { /* err */ }

            this.banker.setBalance(playerid, balance - betAmount);

            game.gameEvent.emit(
                'player-posted-ante',
                playerid,
                betType,
                betAmount,
                (pid, bet, pot, clear) => {
                    this.socketconn.in(this.roomId).emit('table-state', {
                        playerName: this.names.get(pid),
                        playerId: pid,
                        playerSeat: this.players.get(pid),
                        updatedBalance: this.banker.getBalance(pid),
                        betAmount: bet,
                        potsize: pot,
                        clearTable: clear
                    });
                }
            );
        });

        this.tableEvent.on('post-bet', (playerid, gameid, roundPhase, betType, betAmount) => {
            const game = this.games.get(gameid);
            const seat = this.players.get(playerid);

            let balance = this.banker.getBalance(playerid);

            if (balance < betAmount) { /* err */ }

            this.banker.setBalance(playerid, balance - betAmount);

            game.gameEvent.emit(
                'player-posted-bet',
                playerid,
                roundPhase,
                betType,
                betAmount,
                (pid, bet, pot, clear) => {
                    this.socketconn.in(this.roomId).emit('table-state', {
                        playerName: this.names.get(pid),
                        playerId: pid,
                        playerSeat: this.players.get(pid),
                        updatedBalance: this.banker.getBalance(pid),
                        betAmount: bet,
                        potsize: pot,
                        clearTable: clear
                    });
                }
            );
        });
    };

    get roomId() {
        return `table-${this.id}`;
    };

    get playersById() {
        return this.vacancies(false).map(seat => seat[1].player.id);
    };

    get gameCount() {
        return this.games.size;
    };

    get playerCount() {
        return this.vacancies(false).length;
    };

    get currentState() {
        return this.state;
    };

    get seatingState() {
        return [...this.seats];
    };

    get firstAvailableSeat() {
        return this.vacancies(true).find(([i, s]) => s);
    };

    get firstAvailableSeatIndex() {
        return this.firstAvailableSeat[0];
    };

    vacancies(vacant) {
        return [...this.seats].filter(([i, s]) => s.vacant === vacant);
    };

    vacancyCount(vacant) {
        return this.vacancies(vacant).length;
    };

    static seat(playerid, playername, balance, vacate, seatindex, turnorder) {
        return {
            vacant: vacate,
            seatindex: seatindex,
            player: {
                name: playername,
                id: playerid,
                balance: balance || 0
            }
        };
    };
}

module.exports = Table;