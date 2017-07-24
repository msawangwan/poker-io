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

        this.button = {
            position: 0
        };

        this.socketconn = socketconn;

        this.state = tablestate.waitingForPlayers;

        for (let i = 0; i < this.maxseats; i++) {
            this.seats.set(i, Table.seat(-1, `${shared.emptyname}`, 0, true));
        }

        this.tableEvent = new TableEvent();

        this.tableEvent.on('player-joined', (name, id, onjoinhandler) => {
            const assignedSeat = this.firstAvailableSeatIndex;

            this.seats.set(assignedSeat, Table.seat(id, name, 500, false));

            onjoinhandler(name, this.id, assignedSeat, this.seatingState, () => {
                if (this.vacancyCount(false) > 2) {
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

        this.tableEvent.on('determine-dealer', (gameid, ondetermineddealer) => {
            const game = this.games.get(gameid);

            {
                console.log('===');
                console.log('determine dealer for game: ' + gameid);
                // console.log(game);
                console.log('===');
            }

            ondetermineddealer(game.button, game.smallblind, game.bigblind);
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

    static seat(playerid, name, balance, vacate) {
        return {
            vacant: vacate,
            position: null,
            player: {
                name: name,
                id: playerid,
                balance: balance || 0
            }
        };
    };
}

module.exports = Table;