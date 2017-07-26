const clientutil = require('../client').util;
const idutil = require('../id-util')();
const poker = require('../poker');

const debug = {
    table: {
        id: 0
    }
};

class ClientPortal {
    constructor(server, port, ws) {
        this.server = server;
        this.port = port;
        this.ws = ws;

        this.conns = new Map();
        this.tables = new Map();

        this.getFirstTable = () => this.tables.get(0);

        this.gamelookup = (socketid) => this.tables.get(this.playerdb.get(socketid));
    };

    setup() {
        this.banker = new poker.Banker();

        let table = this.getFirstTable();

        if (!table) {
            table = new poker.Table(9, this.ws, this.banker);
        }

        {
            console.log('===')
            console.log('client portal setup completed');
            console.log(`created a new table`);
            console.log(`table id: ${table.id}`);
            console.log(`table room id: ${table.roomId}`);
            console.log('created a banker');
            console.log('===')
        }

        this.tables.set(table.id, table);
    };

    handleClientConnections() {
        const io = this.ws;

        io.on('connect', socket => {
            const guestname = clientutil.assignGuestName();
            const table = this.getFirstTable();

            this.conns.set(socket.id, guestname);
            this.banker.registerClient(socket.id, 500);

            table.tableEvent.emit('player-joined', guestname, socket.id, (playername, tableid, assignedSeat, seatStates, cb) => {
                socket.emit('assigned-table', {
                    guestname: playername,
                    table: {
                        id: tableid,
                        assignedSeat: assignedSeat,
                        seatingState: seatStates
                    }
                });

                socket.to(`table-${tableid}`).emit('a-player-has-joined', {
                    table: {
                        id: tableid,
                        seatingState: seatStates
                    }
                });

                socket.join(`table-${tableid}`);

                cb();
            });

            socket.on('player-submit-action', (data) => {
                this.tables.get(data.tableid).tableEvent.emit(
                    'game-turn-action',
                    data.betType,
                    data.betAmount,
                    data.gameid,
                    socket.id
                );
            });

            socket.on('disconnect', () => {
                console.log(`player disconnected ${socket.id}`);
            });
        });

        this.server.listen(this.port, () => {
            console.log('serving ...', `port: ${this.port}`);
        });
    };
}

module.exports = (server, port, ws) => new ClientPortal(server, port, ws);