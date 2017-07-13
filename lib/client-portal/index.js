const idutil = require('../id-util')();

const poker = require('../poker');

function ClientPortal(server, port, ws) {
    this.server = server;
    this.port = port;
    this.ws = ws;

    this.clientIds = new Set();
    this.activeGames = new Map();
}

ClientPortal.prototype.setup = function () {
    console.log('client portal setup completed');
};

ClientPortal.prototype.handleClientConnections = function () {
    const io = this.ws;

    io.on('connect', socket => {
        const gameid = 0; // todo: will always be 0 until we allow more than 1 game per server

        console.log(`client connected: ${socket.client.request.url}`);

        this.clientIds.add(socket.id);

        socket.on('joined-table', player => {
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

                if (seatPosition !== -1) {
                    game.seating.set(seatPosition, {
                        vacant: false,
                        player: {
                            name: `${player.name}`,
                            balance: player.balance,
                            id: socket.id
                        }
                    });

                    let gamestate = game.state;

                    if (gamestate === -1) {
                        socket.join('waiting-room');

                        if (socket.adapter.rooms['waiting-room'].length > 1) {
                            gamestate = 0;
                            game.state = gamestate;
                        }
                    } else {
                        socket.join('current-game-session');
                    }

                    this.activeGames.set(gameid, game);

                    socket.emit('player-assigned-seat', { seat: seatPosition });

                    io.of('/').emit('table-seating-state', { seating: [...game.seating] });
                    io.of('/').emit('current-game-state', { state: gamestate });
                }
            }
        });

        socket.on('waiting-for-players', () => {
            socket.join('waiting-room');

            const numwaiting = socket.adapter.rooms['waiting-room'].length;

            console.log(`${socket.id} is waiting for players`);
            console.log(`${numwaiting} player(s) waiting for game start`);
        });

        const cmdq = [];

        socket.on('game-start', () => {
            console.log('game started!');
            
            socket.leave('waiting-room');
            socket.join('current-game-session');
        });

        socket.on('deal', () => {

        });

        socket.on('disconnect', () => {
            console.log(`player disconnected ${socket.id}`);

            const game = this.activeGames.get(gameid);

            let removed = -1;

            for (const [pos, seat] of game.seating) {
                if (seat.vacant) {
                    continue;
                }

                if (seat.player.id === socket.id) {
                    removed = pos;
                    break;
                }
            }

            if (removed !== -1) {
                game.seating.set(removed, {
                    vacant: true,
                    player: undefined
                });

                console.log(`removed player from table: ${removed}`);

                io.of('/').emit('table-seating-state', { seating: [...game.seating] });
            }

            this.activeGames.set(gameid, game);
        });
    });

    this.server.listen(this.port, () => {
        console.log('serving ...', `port: ${this.port}`);
    });
};

module.exports = (server, port, ws) => new ClientPortal(server, port, ws);