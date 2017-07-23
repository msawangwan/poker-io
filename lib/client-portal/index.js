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
        let table = this.getFirstTable();

        if (!table) {
            table = new poker.Table(9);
        }

        {
            console.log('===')
            console.log('client portal setup completed');
            console.log(`created a new table`);
            console.log(`table id: ${table.id}`);
            console.log(`table room id: ${poker.Table.roomId(table.id)}`);
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

            {
                console.log('===');
                console.log(`client connected`);
                console.log(`id: ${socket.id}`);
                console.log(`url: ${socket.client.request.url}`);
                console.log(`assigned name: ${guestname}`);
                console.log('===');
            }

            const onjoin = (playername, tableid, assignedSeat, seatStates) => {
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
            };

            const ontablestaterequest = () => {
                socket.emit('server-sent-table-state', {
                    tablestate: 'poopy'
                });
            }

            socket.on('table-state-requested', ontablestaterequest);

            socket.on('disconnect', () => {
                console.log(`player disconnected ${socket.id}`);
            });

            table.tableEvent.emit('player-joined', guestname, socket.id, onjoin);
        });

        this.server.listen(this.port, () => {
            console.log('serving ...', `port: ${this.port}`);
        });
    };
}

module.exports = (server, port, ws) => new ClientPortal(server, port, ws);