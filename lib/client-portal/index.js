const idutil = require('../id-util')();

function ClientPortal(server, port, ws) {
    this.server = server;
    this.port = port;
    this.ws = ws;

    this.clientIds = new Set();
    this.clientNames = new Set();

    this.seating = new Map();

    for (let i = 0; i < 9; i++) {
        this.seating.set(i, {
            vacant: true,
            player: undefined
        });
    }

    this.game = {

    }

    // this.getSeats = empty => [...this.seating].filter(([k, v]) => v.vacant === empty);
}

ClientPortal.prototype.setup = function () {
    console.log('client portal setup completed');
};

ClientPortal.prototype.handleClientConnections = function () {
    const io = this.ws;

    io.on('connect', socket => {
        console.log(`client connected: ${socket.client.request.url}`);

        if (this.clientIds.has(socket.id)) {
            socket.emit('err-client-already-connected', { socketid: socket.id });
        } else {
            let nextAvailableSeat = -1;

            for (const [seatindex, seat] of this.seating.entries()) {
                if (seat.vacant) {
                    nextAvailableSeat = seatindex;
                    break;
                }
            }

            if (nextAvailableSeat > -1) {
                this.seating.set(nextAvailableSeat, {
                    vacant: false,
                    player: {
                        name: `some name ${nextAvailableSeat}`,
                        id: socket.id
                    }
                });

                console.log(this.seating);

                this.clientIds.add(socket.id);
                this.clientNames.add(this.seating.get(nextAvailableSeat).player.name); // todo: um, so unnecessary

                socket.emit('ack-client-connect-success', { assignedseat: nextAvailableSeat });
            } else {
                socket.emit('ack-client-connect-fail', { reason: 'no seats available' });
            }
        }

        socket.on('client-request-seating-update', client => {
            const tableSeatingState = [];

            for (const [seatindex, seat] of this.seating.entries()) {
                if (seat.vacant) {
                    tableSeatingState[seatindex] = 'empty';
                } else if (seatindex === client.playerseatindex) {
                    tableSeatingState[seatindex] = 'self';
                } else {
                    tableSeatingState[seatindex] = seat.player.name;
                }
            }

            socket.emit('server-response-seating-update', { seatingstate: tableSeatingState });
        });

        socket.on('client-request-table-state', client => {

        });
    });

    this.server.listen(this.port, () => {
        console.log('serving ...', `port: ${this.port}`);
    });
};

module.exports = (server, port, ws) => new ClientPortal(server, port, ws);