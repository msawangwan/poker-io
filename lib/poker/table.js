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
    constructor(numberOfSeats, socketconn) {
        this.id = shared.lastid + 1;

        this.maxseats = numberOfSeats;

        this.games = new Map();
        this.seats = new Map();
        this.players = new Map();

        this.button = {
            position: 3
        };

        this.socketconn = socketconn;

        this.state = tablestate.waitingForPlayers;

        for (let i = 0; i < this.maxseats; i++) {
            this.seats.set(i, Table.seat(-1, `${shared.emptyname}`, 0, true, -1));
        }

        this.tableEvent = new TableEvent();

        this.tableEvent.on('player-joined', (name, id, onjoinhandler) => {
            const assignedSeat = this.firstAvailableSeatIndex;

            this.seats.set(assignedSeat, Table.seat(id, name, 500, false, assignedSeat, assignedSeat));
            this.players.set(id, assignedSeat);

            const allplayers = this.vacancies(false);

            let turnorder = 0;

            for (const seat of this.vacancies(false)) {
                this.seats.get(seat[0]).turnorder = turnorder;
                turnorder += 1;
            }

            onjoinhandler(name, this.id, assignedSeat, this.seatingState, () => {
                if (this.vacancyCount(false) > 3) {
                    if (this.state === tablestate.waitingForPlayers) {
                        this.state = tablestate.dealInPlay;

                        const gameId = this.gameCount;

                        this.games.set(
                            gameId,
                            new Game(gameId, this.vacancies(false), this.button.position)
                        );

                        this.socketconn.in(this.roomId).emit('game-started', {
                            gameId: gameId
                        });

                        this.button.position += 1 % this.maxseats;
                    }
                }
            });
        });

        this.tableEvent.on('determine-turn-order', (gameid, playerid, onsendturnorder) => {
            const game = this.games.get(gameid);
            const seatIndex = this.players.get(playerid);
            const turnOrderIndex = (game.button + seatIndex % game.playerCount) % game.playerCount;

            {
                console.log('===');
                console.log('determine turnorder:');
                console.log('game id: ' + gameid);
                console.log('player id: ' + playerid);
                console.log('button index: ' + game.button);
                console.log('seat index: ' + seatIndex);
                console.log('turn order: ' + turnOrderIndex);
                console.log('===');
            }

            onsendturnorder(game.button, turnOrderIndex);
        });

        // this.tableEvent.on('player-ready-up')
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
            turnorder: turnorder,
            player: {
                name: playername,
                id: playerid,
                balance: balance || 0
            }
        };
    };
}

module.exports = Table;