const logctr = require('../logger')('client portal');
const idutil = require('../id-util')();

const debug = (a, ...b) => logctr.log(a, ...b);

function ClientPortal(server, port, ws) {
    this.server = server;
    this.port = port;
    this.ws = ws;

    this.clients = new Map();
    this.clientNames = new Map();

    this.seating = new Map();

    for (let i = 0; i < 9; i++) {
        this.seating.set(i, {
            vacant: true,
            player: undefined
        });
    }

    this.getSeats = empty => [...this.seating].filter(([k, v]) => v.vacant === empty);
}

ClientPortal.prototype.setup = function () {
    debug('setup complete');
};

ClientPortal.prototype.handleClientConnections = function () {
    const io = this.ws;

    io.on('connect', socket => {
        debug('client connected', `addr: ${socket.client.request.url}`);

        if (this.clients.has(socket.id)) {
            socket.emit('err-client-already-connected', { socketid: socket.id });
        } else {
            const tableState = [];

            for (const s of this.seating.entries()) {
                if (s[1].vacant) {
                    tableState.push('empty seat');
                    continue;
                }

                tableState.push(`${s[1].player.name} is seated at position ${s[0]}`);
            }

            socket.emit('update-ui-display-table', { tableState: tableState });

            this.clients.set(socket.id, socket);
            this.clientNames.set(socket.id, 'some-name');

            debug('vacant seats', ...this.getSeats(true));

            const vacantSeats = this.getSeats(true);

            if (vacantSeats.length > 0) {
                const assignedSeaet = vacantSeats[0][0];

                this.seating.set(assignedSeaet, {
                    vacant: false,
                    player: {
                        name: 'some-name',
                        id: socket.id
                    }
                });
            } else {
                socket.emit('err-no-seats-empty');
            }

            debug('vacant seats', ...this.getSeats(true));
        }
    });

    this.server.listen(this.port, () => {
        debug('serving ...', `port: ${this.port}`);
    });
};

module.exports = (server, port, ws) => new ClientPortal(server, port, ws);