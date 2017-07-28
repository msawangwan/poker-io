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
                if (this.vacancyCount(false) > 2) {
                    if (this.state === tablestate.waitingForPlayers) {
                        this.state = tablestate.dealInPlay;

                        const players = this.vacancies(false);
                        const gameId = this.gameCount;

                        const game = new Game(gameId, players, this.button.position);

                        // game.gameEvent.once('collect-small-blind', (smallBlindId, minbet, potsize) => {
                        //     this.socketconn.to(smallBlindId).emit('collect-small-blind', {
                        //         minbet: minbet
                        //     });
                        // });

                        game.gameEvent.on('collect-blind', (blindPlayerById, blindType, blindBetSize) => {
                            this.socketconn.to(blindPlayerById).emit('collect-blind', {
                                blindType: blindType,
                                blindBetSize: blindBetSize
                            });
                        });

                        game.gameEvent.once('predeal', (smallblindId, allowedactions, minbet) => {
                            this.socketconn.to(smallblindId).emit('action-to-player', {
                                gamePhase: 'predeal',
                                allowedactions: allowedactions,
                                minbet: minbet
                            });
                        });

                        game.gameEvent.once('preflop', (dealtCards, utgid, allowedactions, minbet) => {
                            for (const [id, i] of this.players) {
                                this.socketconn.to(id).emit('player-dealt-cards', { a: dealtCards.get(id).a, b: dealtCards.get(id).b });  // emit as action?
                            }

                            this.socketconn.to(utgid).emit('action-to-player', {
                                gamePhase: 'preflop',
                                allowedactions: allowedactions,
                                minbet: minbet
                            });
                        });

                        game.gameEvent.once('postflop', () => {

                        });

                        game.gameEvent.once('preriver', () => {

                        });

                        game.gameEvent.once('postriver', () => {

                        });

                        game.gameEvent.on('notify-next-to-act', (toplayerid, phase, allowedactions, minbet) => {
                            this.socketconn.to(toplayerid).emit('action-to-player', {
                                gamePhase: phase,
                                allowedactions: allowedactions,
                                minbet: minbet
                            });
                        });

                        this.games.set(gameId, game);

                        game.gameEvent.emit('game-start', (playerid, gameid, gamebutton) => {
                            const seatIndex = this.players.get(playerid);
                            const turnOrderIndex = (game.button + seatIndex % game.playerCount) % game.playerCount;

                            this.socketconn.to(playerid).emit('game-started', {
                                gameId: gameId,
                                buttonIndex: game.buttonPosition
                            });
                        });
                    }
                }
            });
        });

        this.tableEvent.on('post-blind', (playerid, gameid, blindType, blindAmount) => {
            const game = this.games.get(gameid);
            const seat = this.players.get(playerid);

            let balance = this.banker.getBalance(playerid);

            if (balance < blindAmount) {

            }

            this.banker.setBalance(playerid, balance - blindAmount);

            game.gameEvent.emit(
                'player-posted-blind',
                playerid,
                blindType,
                blindAmount,
                (pid, bet, pot) => {
                    this.socketconn.in(this.roomId).emit('update-table-state', {
                        playerName: this.names.get(pid),
                        playerId: pid,
                        playerSeat: this.players.get(pid),
                        updatedBalance: this.banker.getBalance(pid),
                        betAmount: bet,
                        potsize: pot
                    });
                }
            );
        });

        // this.tableEvent.on('post-small-blind', (playerid, gameid, blindAmount) => {
        //     const game = this.games.get(gameid);
        //     const seat = this.players.get(playerid);

        //     let balance = this.banker.getBalance(playerid);

        //     if (balance < blindAmount) {

        //     }

        //     this.banker.setBalance(playerid, balance - blindAmount);

        //     game.gameEvent.emit(
        //         'player-posted-small-blind',
        //         playerid,
        //         blindAmount,
        //         (pid, bet, pot) => {
        //             this.socketconn.in(this.roomId).emit('update-table-state', {
        //                 playerName: this.names.get(pid),
        //                 playerId: pid,
        //                 playerSeat: this.players.get(pid),
        //                 updatedBalance: this.banker.getBalance(pid),
        //                 betAmount: bet,
        //                 potsize: pot
        //             });
        //         }
        //     );
        // });


        this.tableEvent.on('game-turn-action', (betActionType, betAmount, turnPhase, gameid, playerid) => {
            const game = this.games.get(gameid);
            const seatIndex = this.players.get(playerid);

            let balance = this.banker.getBalance(playerid);

            if (balance < betAmount) {
                console.log('===');
                console.log('player does not have the balance to cover bet');
                console.log('do some sort of big error thing here');
                console.log('===');
            }

            balance -= betAmount;

            this.banker.setBalance(playerid, balance);

            game.gameEvent.emit(
                'turn-action',
                betActionType,
                betAmount,
                turnPhase,
                playerid,
                (id, amount, potsize) => {
                    this.socketconn.in(this.roomId).emit('update-table-state', {
                        playerName: this.names.get(playerid),
                        playerId: id,
                        playerSeat: this.players.get(playerid),
                        updatedBalance: this.banker.getBalance(playerid),
                        betAmount: amount,
                        potsize: potsize
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
            turnorder: turnorder, // TODO: remove
            player: {
                name: playername,
                id: playerid,
                balance: balance || 0
            }
        };
    };
}

module.exports = Table;