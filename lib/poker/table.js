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
            const balance = this.banker.getBalance(id);

            this.seats.set(assignedSeat, Table.seat(id, name, balance, false, assignedSeat, assignedSeat));
            this.players.set(id, assignedSeat);
            this.names.set(id, name);

            // invoke on join callback
            onjoinhandler(name, this.id, assignedSeat, this.seatingState, balance, () => {
                if (this.vacancyCount(false) > this.startThreshold) {
                    if (this.state === tablestate.waitingForPlayers) {
                        this.state = tablestate.dealInPlay;

                        const players = this.vacancies(false);
                        const gameId = this.gameCount;
                        const game = new Game(gameId, players, this.button.position);

                        game.gameEvent.on('state', (player, acting, other, game, pot) => {
                            this.socketconn.to(player.id).emit('state', {
                                game: {
                                    state: game.state,
                                    turnId: game.turnId
                                },
                                player: {
                                    client: {
                                        balance: player.stackSize
                                    },
                                    acting: {
                                        id: acting.id,
                                        order: acting.seatIndex,
                                        balance: acting.stackSize
                                    },
                                    other: {
                                        foldedIds: other.foldedIds,
                                        balances: other.stacks
                                    }
                                },
                                pot: {
                                    size: pot.size,
                                    current: pot.sizeCurrent
                                }
                            });
                        });

                        game.gameEvent.on('enter-turn', (player, game, turn) => {
                            this.socketconn.to(player.id).emit('enter-turn', {
                                game: {
                                    state: game.state,
                                    turnId: game.turnId
                                },
                                turn: {
                                    index: player.betOrderIndex,
                                    actions: turn.actions,
                                    owes: turn.matchAmount
                                },
                                player: {
                                    balance: player.stackSize
                                }
                            });
                        });

                        game.gameEvent.on('best-hand', data => {
                            this.socketconn.to(data[0]).emit('best-hand', {
                                hand: data[1]
                            });
                        });

                        game.gameEvent.on('deal-community-cards', data => {
                            this.socketconn.in(this.roomId).emit('deal-community-cards', {
                                round: data.round,
                                cards: data.cards
                            });
                        });

                        game.gameEvent.once('deal-player-cards', data => {
                            for (const pid of data.ids) {
                                for (const e of data.cards) {
                                    if (e[0] === pid) {
                                        this.socketconn.to(pid).emit('deal-player-cards', {
                                            cards: e[1]
                                        });
                                    }
                                }
                            }
                        });

                        this.games.set(gameId, game);

                        game.gameEvent.emit('game-start', (gameid) => {
                            this.socketconn.to(this.roomId).emit('game-started', {
                                gameId: gameid,
                                buttonIndex: game.buttonPosition
                            });
                        });
                    }
                }
            });
        });

        this.tableEvent.on('exit-turn', (playerId, gameId, actionType, betAmount) => {
            this.games.get(gameId).validateTurn(playerId, actionType, betAmount);
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