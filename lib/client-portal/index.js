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
            };

            socket.on('joined-table', player => {
                let table = this.getFirstTable();

                if (!table) {
                    table = new poker.Table(9);
                }

                const tableroomid = `table-${table.id}`;

                {
                    console.log('===');
                    console.log(`player joined table: ${tableroomid}`);
                    console.log(`name: ${player.name}`);
                    console.log(`id: ${socket.id}`);
                    console.log('===');
                }

                const onsit = (gameId, assignedIndex, occupiedSeats) => {
                    {
                        console.log('===')
                        console.log(`player joined game: ${gameId}`);
                        console.log(`assinged seat: ${assignedIndex}`);
                        console.log('===')
                    }

                    socket.to(tableroomid).emit('a-player-was-seated', {
                        tableGameState: 'waiting',
                        occupiedSeats: occupiedSeats
                    });

                    socket.join(tableroomid);

                    socket.emit('player-seated', {
                        seatedPlayer: {
                            seatIndex: assignedIndex,
                            name: player.name,
                            balance: player.balance
                        },
                        seatedPlayers: occupiedSeats,
                        gameId: gameId
                    });
                };

                const onreject = (reason) => {
                    console.log('player-joined-emit: rejected from table, pid ' + socket.id);
                    console.log('player-joined-emit: reason is, ' + reason);
                };

                table.tableEvent.emit('player-request-seat',
                    player.name,
                    socket.id,
                    player.balance,
                    onsit,
                    onreject
                );

                this.tables.set(table.id, table);
            });

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