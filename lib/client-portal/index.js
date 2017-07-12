const idutil = require('../id-util')();

const poker = require('../poker');

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

    this.activeGames = new Map();

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
            // socket.emit('err-client-already-connected', { socketid: socket.id });
        } else {
            // let nextAvailableSeat = -1;

            // for (const [seatindex, seat] of this.seating.entries()) {
            //     if (seat.vacant) {
            //         nextAvailableSeat = seatindex;
            //         break;
            //     }
            // }

            // if (nextAvailableSeat > -1) {
            //     this.seating.set(nextAvailableSeat, {
            //         vacant: false,
            //         player: {
            //             name: `some name ${nextAvailableSeat}`,
            //             id: socket.id
            //         }
            //     });

            //     console.log(this.seating);

            //     this.clientIds.add(socket.id);
            //     this.clientNames.add(this.seating.get(nextAvailableSeat).player.name); // todo: um, so unnecessary

            //     socket.emit('ack-client-connect-success', { assignedseat: nextAvailableSeat });
            // } else {
            //     socket.emit('ack-client-connect-fail', { reason: 'no seats available' });
            // }
        }

        socket.on('joined-table', player => {
            const gameid = 0; // todo: will always be 0 until we allow more than 1 game per server

            if (this.activeGames.size < 1) {
                this.activeGames.set(gameid, poker.newGame('poker', 0));
            }

            const game = this.activeGames.get(gameid);
            const playerCount = game.players.size;

            if (playerCount < 10) {
                game.players.set(socket.id, player);

                let seatPosition = -1;

                for (const [pos, seat] of game.seating) {
                    if (seat.vacant) {
                        seatPosition = pos;
                        break;
                    }
                }

                if (seatPosition > -1) {
                    game.seating.set(seatPosition, {
                        vacant: false,
                        player: {
                            name: `${player.name}`,
                            balance: player.balance,
                            id: socket.id
                        }
                    });

                    this.activeGames.set(gameid, game);

                    socket.emit('update-table-seating', { seat: seatPosition, seating: [...game.seating] });
                }
            }
        });

        socket.on('client-request-game-state', client => {
            if (this.activeGames.size < 1) {
                this.activeGames.set(0, poker.newGame('tyrant-poker', 0)); // todo: for now we will only ever have 1 game at a time
            }

            const game = this.activeGames.get(0);

            socket.emit('game-state-phase', { phase: game.getState() });
        });

        socket.on('update-gamestate-request', client => {
            console.log('update game state: ' + client.playerAtSeat);

            socket.emit('update-gamestate-response');
        });

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
    });

    this.server.listen(this.port, () => {
        console.log('serving ...', `port: ${this.port}`);
    });
};

module.exports = (server, port, ws) => new ClientPortal(server, port, ws);