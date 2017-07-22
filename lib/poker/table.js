const Game = require('./game');
const EventEmitter = require('events');

const lastId = -1;

class TableEvent extends EventEmitter { }

class Table {
    constructor(numberOfSeats) {
        this.id = lastId + 1;
        this.currentGame = null;

        this.games = new Map();
        this.seats = new Map();

        for (let i = 0; i < numberOfSeats; i++) {
            this.seats.set(i, Table.seat(-1, '(empty)', 0, true));
        }

        this.vacantSeats = (vacant) => [...this.seats].filter(([i, s]) => s.vacant === vacant);
        this.vacantSeatCount = (vacant) => this.vacantSeats(vacant).length;

        this.tableEvent = new TableEvent();

        this.tableEvent.on('player-request-seat', (playername, playerid, playerbalance, onsit, onreject) => {
            if (this.vacantSeatCount(true) < 1) {
                onreject('no seats left!');
            } else {
                const free = this.vacantSeats(true)[0];

                const seatpos = free[0];
                const seat = free[1];

                seat.vacant = false;

                seat.player.name = playername;
                seat.player.id = playerid;
                seat.player.balance = playerbalance;

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

    static seat(playerid, name, balance, vacate) {
        return {
            vacant: vacate,
            player: {
                name: name,
                id: playerid,
                balance: balance || 0
            }
        };
    };
}

module.exports = Table;