const idutil = require('../id-util')();

const poker = require('../poker');

function ClientPortal(server, port, ws) {
    this.server = server;
    this.port = port;
    this.ws = ws;

    this.clientIds = new Set();
    this.activeGames = new Map();
    this.playerdb = new Map();

    this.gamelookup = (socketid) => this.activeGames.get(this.playerdb.get(socketid));
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
                console.log('player joined table');
                console.log(`playerid: ${socket.id}`)
                console.log(`current game is in state: ${game.state}`)

                game.players.set(socket.id, player);

                let assignedSeatingPosition = -1;

                for (const [pos, seat] of game.seating) {
                    if (seat.vacant) {
                        assignedSeatingPosition = pos;
                        break;
                    }
                }

                if (assignedSeatingPosition !== -1) {
                    const addedPlayer = {
                        name: `${player.name}`,
                        balance: player.balance,
                        id: socket.id
                    };

                    game.playerEvent.emit('player-seated', addedPlayer, assignedSeatingPosition, (gamestate) => {
                        if (gamestate === -1) {
                            socket.join('waiting-room');

                            const waitingRoomSize = socket.adapter.rooms['waiting-room'].length;

                            if (waitingRoomSize > 1) {
                                game.stateChangeEvent.emit('game-start', gamestate, (nextState) => {
                                    io.of('/').emit('game-start', { gamestate: nextState });
                                });
                            }
                        }

                        console.log('player added!');
                        console.log(`current gamestate: ${gamestate}`);

                        io.of('/').emit('table-seating-state', { seating: [...game.seating] });
                    });

                    socket.emit('player-assigned-seat', { seat: assignedSeatingPosition });

                    this.playerdb.set(socket.id, gameid);
                    this.activeGames.set(gameid, game);
                }
            }
        });

        socket.on('player-readyup', () => {
            if (socket.adapter.rooms['waiting-room']) {
                socket.leave('waiting-room');
            } else {
                console.log("NOT IN ROOM");
            }

            const game = this.gamelookup(socket.id);

            game.playerEvent.emit('player-readyup', socket.id, (dealId) => {
                socket.join(`ready-up-deal-${dealId}`);
                socket.emit('player-readyup-accepted', { dealId: dealId });
            });
        });

        socket.on('player-ready-for-shuffle', info => {
            const game = this.gamelookup(socket.id);
            const predealroom = `ready-up-deal-${info.dealId}`;

            if (socket.adapter.rooms[predealroom]) {
                socket.leave(predealroom);
                game.playerEvent.emit('player-ready-for-deal', socket.id, info.dealId, () => {
                    console.log('player ready for deal');
                    const dealroom = `deal-${info.dealId}`;

                    socket.emit('deck-shuffled');
                });
            } else {
                console.log("NOT IN ROOM");
            }
        });

        socket.on('player-waiting-for-deal', () => {
            const game = this.gamelookup(socket.id);

            game.dealerEvent.emit('deal-hole-cards', socket.id, (holecards, gamestate) => {
                socket.emit('hand-dealt', { playerhand: holecards });
            });
        });

        // socket.on('player-ready-for-game', () => {
        //     socket.leave('waiting-room');
        //     socket.join('current-game-session');

        //     const gameinstanceid = this.playerdb.get(socket.id);
        //     const game = this.activeGames.get(gameinstanceid);

        //     const onstart = (gamestate) => {
        //         io.of('/').emit('current-game-state', { state: gamestate });
        //     };

        //     game.gamestateNotifier.emit('game-started', onstart);

        //     this.activeGames.set(gameinstanceid, game);
        // });

        // socket.on('game-ready-for-start', () => {

        //     const game = this.gamelookup(socket.id);

        //     const onready = (gamestate) => {
        //         socket.emit('current-game-state', { state: gamestate });
        //     };

        //     game.dealerEvent.emit('player-ready', socket.id, onready);
        // });

        // socket.on('ready-for-shuffle', () => {
        //     const game = this.gamelookup(socket.id);

        //     game.dealerEvent.emit('shuffle-deck', (gamestate) => {
        //         console.log('game state emitted to all clients: ' + gamestate);
        //         io.of('/').emit('current-game-state', { state: gamestate });
        //     });
        // });

        // socket.on('waiting-for-hole-cards', () => {
        //     const game = this.gamelookup(socket.id);

        //     game.dealerEvent.emit('deal-hole-cards', socket.id, (holecards, gamestate) => {
        //         socket.emit('hand-dealt', { playerhand: holecards });
        //         socket.emit('current-game-state', { state: gamestate });
        //     });
        // });

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

                if (game.state !== -1) { // aka game is not in 'waiting for players' state
                    console.log('TODO: need to set the game state back to 0');
                }

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