const Game = require('./game');
const EventEmitter = require('events');

const shared = {
    lastid: -1,
    emptyname: '[...]'
};

const tablestate = {
    waitingForPlayers: 'waitingForPlayers',
    dealInPlay: 'dealInPlay'
};

class TableEvent extends EventEmitter { }

class Table {
    constructor(numberOfSeats, socketconn, banker) {
        this.id = shared.lastid + 1;

        this.maxseats = numberOfSeats;

        this.games = new Map();
        this.seats = new Map();
        this.players = new Map();

        this.button = {
            position: 0
        };

        this.socketconn = socketconn;
        this.banker = banker;

        this.state = tablestate.waitingForPlayers;

        for (let i = 0; i < this.maxseats; i++) {
            this.seats.set(i, Table.seat(-1, `${shared.emptyname}`, 0, true, -1));
        }

        this.tableEvent = new TableEvent();

        this.tableEvent.on('player-joined', (name, id, onjoinhandler) => {
            const assignedSeat = this.firstAvailableSeatIndex;

            this.seats.set(assignedSeat, Table.seat(id, name, this.banker.getBalance(id), false, assignedSeat, assignedSeat));
            this.players.set(id, assignedSeat);

            onjoinhandler(name, this.id, assignedSeat, this.seatingState, () => {
                if (this.vacancyCount(false) > 2) {
                    if (this.state === tablestate.waitingForPlayers) {
                        this.state = tablestate.dealInPlay;

                        const gameId = this.gameCount;
                        const players = this.vacancies(false);
                        const game = new Game(gameId, players, this.button.position);

                        game.gameEvent.on('action', (playerid, actiontype) => {
                            socketconn.to(playerid).emit('action', { type: actiontype }); // postblind, call check raise bet
                        });

                        this.games.set(gameId, game);

                        this.socketconn.in(this.roomId).emit('game-started', {
                            gameId: gameId
                        });

                        this.button.position += 1 % this.maxseats;
                    }
                }
            });
        });

        this.tableEvent.on('determine-turn-order', (gameid, playerid, onsendturnorder) => {
            const game = this.games.get(gameid);
            const seatIndex = this.players.get(playerid);
            const turnOrderIndex = (game.button + seatIndex % game.playerCount) % game.playerCount;

            this.seats.get(seatIndex).turnorder = turnOrderIndex;

            game.updatePlayerTurnOrder(turnOrderIndex, playerid);

            {
                console.log('===');
                console.log('determine turnorder:');
                console.log('game id: ' + gameid);
                console.log('player id: ' + playerid);
                console.log('button index: ' + game.button);
                console.log('seat index: ' + seatIndex);
                console.log('turn order: ' + turnOrderIndex);
                console.log('===');
            }

            onsendturnorder(game.button, turnOrderIndex);
        });

        this.tableEvent.on('bet-action', (betActionType, betAmount, playerid, gameid) => {
            const game = this.games.get(gameid);
            const seatIndex = this.players.get(playerid);

            switch (betActionType) {
                case 'smallblind':
                    game.gameEvent.emit('posted-small-blind', betAmount, playerid, () => {
                        this.socketconn.in(this.roomId).emit('player-posted-blinds', { playerSeat: seatIndex, betAmount: betAmount });
                    });
                    break;
                case 'bigblind':
                    game.gameEvent.emit('posted-big-blind', betAmount, playerid, () => {
                        this.socketconn.in(this.roomId).emit('player-posted-blinds', { playerSeat: seatIndex, betAmount: betAmount });
                    });
                    break;
                default:
                    {
                        console.log('===');
                        console.log('invalid bet action');
                        console.log(betActionType);
                        console.log('===');
                    }
                    break;
            }
        })
    };

    get roomId() {
        return `table-${this.id}`;
    };

    get playersById() {
        return this.vacancies(false).map(seat => seat[1].player.id);
    };

    get gameCount() {
        return this.games.size;
    };

    get playerCount() {
        return this.vacancies(false).length;
    };

    get currentState() {
        return this.state;
    };

    get seatingState() {
        return [...this.seats];
    };

    get firstAvailableSeat() {
        return this.vacancies(true).find(([i, s]) => s);
    };

    get firstAvailableSeatIndex() {
        return this.firstAvailableSeat[0];
    };

    vacancies(vacant) {
        return [...this.seats].filter(([i, s]) => s.vacant === vacant);
    };

    vacancyCount(vacant) {
        return this.vacancies(vacant).length;
    };

    static seat(playerid, playername, balance, vacate, seatindex, turnorder) {
        return {
            vacant: vacate,
            seatindex: seatindex,
            turnorder: turnorder,
            player: {
                name: playername,
                id: playerid,
                balance: balance || 0
            }
        };
    };
}

module.exports = Table;