const idutil = require('../id-util')();
const poker = require('../poker');

const debug = {
    table: {
        id: 0
    }
};

function ClientPortal(server, port, ws) {
    this.server = server;
    this.port = port;
    this.ws = ws;

    this.clientIds = new Set();
    this.validTables = new Map();

    this.getFirstTable = () => this.validTables.get(0);

    this.gamelookup = (socketid) => this.validTables.get(this.playerdb.get(socketid));
}

ClientPortal.prototype.setup = function () {
    console.log('client portal setup completed');
};

ClientPortal.prototype.handleClientConnections = function () {
    const io = this.ws;

    io.on('connect', socket => {
        console.log(`connect: client connected ${socket.client.request.url}`);

        this.clientIds.add(socket.id);

        socket.on('joined-table', player => {
            console.log('joined-table: player is joining table: ' + `pid: ${socket.id}`)

            if (this.validTables.size < 1) {
                const newTable = new poker.Table(9);
                console.log('created a new table: ' + newTable.id);
                this.validTables.set(newTable.id, newTable);
            }

            const table = this.getFirstTable();

            const onsit = (seatIndex, gameId) => {
                console.log('player-joined-emit: player seated ' + socket.id);
                console.log('player-joined-emit: seat index ' + seatIndex);
                console.log('player-joined-emit: game id, ' + gameId);

                const roomid = `table-${table.id}`;

                socket.join(roomid);

                const otherplayers = table.vacantSeats(false);

                socket.to(roomid).emit('a-player-was-seated', {
                    seatCount: table.vacantSeats(false),
                    seatedPlayers: otherplayers
                });

                socket.emit('player-seated', { seatIndex: seatIndex, seatedPlayers: otherplayers, gameId: gameId });
            };

            const onreject = (reason) => {
                console.log('player-joined-emit: rejected from table, pid ' + socket.id);
                console.log('player-joined-emit: reason is, ' + reason);
            };

            table.tableEvent.emit('player-request-seat', player.name, socket.id, player.balance, onsit, onreject);
        });




        // socket.on('player-readyup', () => {
        //     if (socket.adapter.rooms[phases.predeal]) {
        //         socket.leave(phases.predeal);
        //     } else {
        //         console.log("NOT IN ROOM");
        //     }

        //     const game = this.gamelookup(socket.id);

        //     game.playerEvent.emit('player-readyup', socket.id, (dealId) => {
        //         socket.join(`ready-up-deal-${dealId}`);
        //         socket.emit('player-readyup-accepted', { dealId: dealId });
        //     });
        // });

        // socket.on('player-ready-for-shuffle', info => {
        //     const game = this.gamelookup(socket.id);
        //     const predealroom = `ready-up-deal-${info.dealId}`;

        //     if (socket.adapter.rooms[predealroom]) {
        //         socket.leave(predealroom);
        //         game.playerEvent.emit('player-ready-for-deal', socket.id, info.dealId, () => {
        //             console.log('player ready for deal');
        //             const dealroom = `deal-${info.dealId}`;

        //             socket.emit('deck-shuffled');
        //         });
        //     } else {
        //         console.log("NOT IN ROOM");
        //     }
        // });

        // socket.on('player-waiting-for-deal', () => {
        //     const game = this.gamelookup(socket.id);

        //     game.dealerEvent.emit('deal-hole-cards', socket.id, (holecards, gamestate) => {
        //         socket.emit('hand-dealt', { playerhand: holecards });
        //     });
        // });

        // socket.on('player-ready-for-game', () => {
        //     socket.leave(phases.predeal);
        //     socket.join('current-game-session');

        //     const gameinstanceid = this.playerdb.get(socket.id);
        //     const game = this.validTables.get(gameinstanceid);

        //     const onstart = (gamestate) => {
        //         io.of('/').emit('current-game-state', { state: gamestate });
        //     };

        //     game.gamestateNotifier.emit('game-started', onstart);

        //     this.validTables.set(gameinstanceid, game);
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

            // const game = this.validTables.get(debug.table.id);

            // let removed = -1;

            // for (const [pos, seat] of game.seating) {
            //     if (seat.vacant) {
            //         continue;
            //     }

            //     if (seat.player.id === socket.id) {
            //         removed = pos;
            //         break;
            //     }
            // }

            // if (removed !== -1) {
            //     game.seating.set(removed, {
            //         vacant: true,
            //         player: undefined
            //     });

            //     if (game.state !== -1) { // aka game is not in 'waiting for players' state
            //         console.log('TODO: need to set the game state back to 0');
            //     }

            //     console.log(`removed player from table: ${removed}`);

            //     io.of('/').emit('table-seating-state', { seating: [...game.seating] });
            // }

            // this.validTables.set(debug.table.id, game);
        });
    });

    this.server.listen(this.port, () => {
        console.log('serving ...', `port: ${this.port}`);
    });
};

module.exports = (server, port, ws) => new ClientPortal(server, port, ws);