const Game = require('./game');
const EventEmitter = require('events');

class TableEvent extends EventEmitter { }

class Table {
    constructor(numberOfSeats) {
        this.currentGame = null;

        this.games = new Map();
        this.seats = new Map();

        for (let i = 0; i < numberOfSeats; i++) {
            this.seats.set(i, Table.seat(-1, true));
        }

        this.vacantSeats = (vacant) => [...this.seats].filter(([i, s]) => s.vacant === vacant);
        this.vacantSeatCount = (vacant) => this.vacantSeats(vacant).length;

        this.tableEvent = new TableEvent();

        this.tableEvent.on('player-request-seat', (playerid, onsit, onreject) => {
            if (this.vacantSeatCount(true) < 1) {
                onreject('no seats left!');
            } else {
                const free = this.vacantSeats(true)[0];

                const seatpos = free[0];
                const seat = free[1];

                seat.vacant = false;
                seat.playerid = playerid;

                this.seats.set(seatpos, seat);

                let game = this.currentGame;

                if (game === null) {
                    game = new Game();
                    game.gameEvent.emit('game-started');

                    this.games.set(game.id, game);
                    this.currentGame = game;
                }

                game.gameEvent.emit('player-joined', seatpos, playerid);

                onsit(seatpos, game.id);
            }
        });
    };

    static seat(playerid, vacate) {
        return {
            vacant: vacate,
            playerid: playerid
        };
    };
}

module.exports = Table;