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
}

ClientPortal.prototype.setup = function () {
    console.log('client portal setup completed');
};

ClientPortal.prototype.handleClientConnections = function () {
    const io = this.ws;

    io.on('connect', socket => {
        console.log(`client connected: ${socket.client.request.url}`);

        this.clientIds.add(socket.id);

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

                    socket.emit('player-assigned-seat', { seat: seatPosition });

                    io.of('/').emit('table-seating-state', { seating: [...game.seating] });
                    io.of('/').emit('game-state', { state: '' });
                }
            }
        });
    });

    this.server.listen(this.port, () => {
        console.log('serving ...', `port: ${this.port}`);
    });
};

module.exports = (server, port, ws) => new ClientPortal(server, port, ws);