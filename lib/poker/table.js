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
                                }
                            });
                        });

                        game.gameEvent.on('state', (player, acting, game, pot) => {
                            this.socketconn.to(player.id).emit('state', {
                                game: {
                                    state: game.state,
                                    turnId: game.turnId
                                },
                                player: {
                                    acting: {
                                        id: acting.id,
                                        order: acting.seatIndex
                                    }
                                },
                                pot: {
                                    size: pot.size,
                                    current: pot.sizeCurrent
                                }
                            });
                        });

                        game.gameEvent.once('deal-holecards', (players, dealtCards) => {
                            for (const [seat, player] of players) {
                                this.socketconn.to(player.id).emit(
                                    'holecards-dealt', {
                                        a: dealtCards.get(player.id).a,
                                        b: dealtCards.get(player.id).b
                                    }
                                );
                            }
                        });

                        game.gameEvent.once('deal-community-cards', (cards, options) => {
                            this.socketconn.in(this.roomId).emit('deal-community-cards', {
                                cards: cards
                            });
                        });

                        game.gameEvent.once('deal-flop', (minBetAmount, flopped) => {
                            this.socketconn.in(this.roomId).emit('flop-dealt', {
                                utg: 0, a: flopped.get(0), b: flopped.get(1), c: flopped.get(2)
                            });
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