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
    constructor(numberOfSeats) {
        this.id = shared.lastid + 1;

        this.games = new Map();
        this.seats = new Map();

        this.state = tablestate.waitingForPlayers;

        for (let i = 0; i < numberOfSeats; i++) {
            this.seats.set(i, Table.seat(-1, `${shared.emptyname}`, 0, true));
        }

        this.tableEvent = new TableEvent();

        this.tableEvent.on('player-joined', (name, id, onjoinhandler) => {
            const assignedSeat = this.firstAvailableSeatIndex;

            this.seats.set(assignedSeat, Table.seat(id, name, 500, false));

            if (this.vacancyCount(false) > 1) {
                if (this.state === tablestate.waitingForPlayers) {
                    this.state = tablestate.dealInPlay;

                    {
                        console.log('===');
                        console.log('enough players seated to start a game');
                        console.log(this.playersById);
                        console.log('===');
                    }

                    this.games.set(this.gameCount, new Game(this.playersById));
                }
            }

            onjoinhandler(name, this.id, assignedSeat, this.seatingState);
        });
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

    static roomId(tableId) {
        return `table-${tableId}`;
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