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

        // this.dealHandlers = new Map();

        this.tableEvent = new TableEvent();

        const playerjoined = (name, id, onjoinhandler) => {
            const assignedSeat = this.firstAvailableSeatIndex;

            this.seats.set(assignedSeat, Table.seat(id, name, 500, false));
            // this.dealHandlers.set(id, onstarthandler);

            // if (vacancyCount(false) > 1) {
            //     if (this.dealHandlers.size > 0) {
            //         for (const [i, h] of dealHandlers) {
            //             h();
            //         }
            //     }
            //     // if (this.state !== tablestate.dealInPlay) {
            //     //     this.state = tablestate.dealInPlay;
            //     // }
            // }

            onjoinhandler(name, this.id, assignedSeat, this.seatingState);
        };

        const startgame = () => {
            const game = new Game();
        }

        this.tableEvent.on('player-joined', playerjoined);
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
        return this.vacancies(vacant).size;
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