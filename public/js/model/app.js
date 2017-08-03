const tickrate = 1000 / 2;
const startupt = 800;

const current = {
    player: null, table: null, game: null, seat: null, bet: 0
};

$(document).ready(() => {
    const clientController = new ClientController();
    const canvasView = new CanvasView('container-canvas');
    const debug = new HTMLLogger();

    const socket = io.connect(window.location.origin, {
        'reconnection': false
    });

    canvasView.clearAndResizeAll();

    clientController.hideAllButtons(true);

    clientController.callbackHandlers.get('bet-range-slider').set('update-button-txt', val => {
        current.bet = current.player.balance * (val * 0.01);

        clientController.$btnsendbet.val(`bet ${current.bet}`);
        clientController.$btnsendraise.val(`raise ${current.bet}`);
    });

    {
        socket.on('connect', (data) => {
            current.table = new Table(9, canvasView);

            current.table.init();
            current.table.redraw();
        });

        socket.on('assigned-table', (data) => { // TODO: send a balance
            current.player = new Player(data.guestname, socket.id, 500, canvasView.getCanvas('player-canvas'));

            current.seat = data.table.assignedSeat;

            current.table.assignedId = data.table.id;

            current.table.tableView.registerTableCenterLabelDrawHandler('waiting for players ...');

            current.table.seatPlayer(data.table.assignedSeat, current.player);
            current.table.seatOpponents(data.table.seatingState, socket.id);

            canvasView.clearAndResizeAll();

            current.table.tableView.registerTableDrawHandler();
        });

        socket.on('a-player-has-joined', (data) => {
            current.table.seatOpponents(data.table.seatingState, socket.id);

            canvasView.clearAndResizeAll();
        });

        socket.on('game-started', (data) => {
            current.table.game = new Game(data.gameId, current.table.players); // todo: deprecate

            current.game = current.table.game; // use this instead of current.table.game

            current.table.buttonIndex = data.buttonIndex;
            current.table.sbIndex = (data.buttonIndex + 1 % current.table.playerCount) % current.table.playerCount;
            current.table.bbIndex = (data.buttonIndex + 2 % current.table.playerCount) % current.table.playerCount;

            current.table.tableView.registerButtonDrawHandler('dealer', current.table.buttonIndex);
            current.table.tableView.registerButtonDrawHandler('sb', current.table.sbIndex);
            current.table.tableView.registerButtonDrawHandler('bb', current.table.bbIndex);

            current.table.tableView.registerTableCenterLabelDrawHandler('game starting ...');

            socket.emit('poll-game-state', {
                tableid: current.table.id,
                gameid: data.gameId
            });

            debug.logobject(data);
            debug.delimit(
                'game is starting',
                `id: ${socket.id}`,
                `name: ${current.player.name}`,
                `seat: ${current.seat}`,
                `button index: ${current.table.buttonIndex}`,
                `small blind index: ${current.table.sbIndex}`,
                `big blind index: ${current.table.bbIndex}`
            );
        });


        socket.on('collect-blind', (data) => {
            debug.delimit(
                `*ACTION*: post ${data.blindType === 'sb' ? 'small' : 'big'} blind`,
                `player: ${current.player.name}`,
                `id: ${socket.id}`
            );

            switch (data.blindType) {
                case 'sb':
                    clientController.$btnsendblind.toggle(clientController.ids.hidebtn);
                    clientController.$btnsendblind.val('post small blind');
                    clientController.$btnsendblind.on('click', () => {
                        socket.emit('post-blind', {
                            blindType: 'sb',
                            betAmount: data.blindBetSize / 2,
                            tableid: current.table.id,
                            gameid: current.table.game.id
                        });

                        clientController.$btnsendblind.toggle(clientController.ids.hidebtn);
                    });
                    break;
                case 'bb':
                    clientController.$btnsendblind.toggle(clientController.ids.hidebtn);
                    clientController.$btnsendblind.val('post big blind');
                    clientController.$btnsendblind.on('click', () => {
                        socket.emit('post-blind', {
                            blindType: 'bb',
                            betAmount: data.blindBetSize,
                            tableid: current.table.id,
                            gameid: current.table.game.id
                        });

                        clientController.$btnsendblind.toggle(clientController.ids.hidebtn);
                    });
                    break;
                default:
                    break;
            }
        });

        socket.on('collect-ante', (data) => {
            {
                debug.delimit(
                    `${current.player.name} action on you ...`, `... the last player did: ${data.actionType}`
                );

                debug.logobject(data);
            };

            let min = data.minBetAmount;

            const previousBets = current.game.getPlayerBets(socket.id);

            if (previousBets) {
                const lastBet = previousBets[previousBets.length - 1];

                debug.delimit(`last bet was ${lastBet}`);

                min = Math.abs(lastBet - data.minBetAmount);
            }

            debug.delimit(`min bet allowed is ${min}`);

            current.bet = min;

            let action = (type, amount) => {
                socket.emit('post-ante', {
                    betType: type,
                    betAmount: amount,
                    tableid: current.table.id,
                    gameid: current.table.game.id
                });

                current.bet = 0;
            };

            const toggleHidden = (minbet) => {
                clientController.$formbetrangeslider.toggle(clientController.ids.hidebtn);

                if (minbet === 0) {
                    clientController.$btnsendcheck.toggle(clientController.ids.hidebtn);
                } else {
                    clientController.$btnsendcall.toggle(clientController.ids.hidebtn);
                }

                clientController.$btnsendraise.toggle(clientController.ids.hidebtn);
                clientController.$btnsendfold.toggle(clientController.ids.hidebtn);
            };

            toggleHidden(min);

            if (min === 0) {
                clientController.$btnsendcheck.on('click', () => {
                    toggleHidden(min);
                    action('check', 0);
                });
            }

            clientController.$btnsendcall.val(`call ${min}`);
            clientController.$btnsendcall.on('click', () => {
                toggleHidden(min);
                action('call', current.bet);
            });

            clientController.$btnsendraise.val(`raise ${data.minBetAmount}`);
            clientController.$btnsendraise.on('click', () => {
                toggleHidden(min);
                action('raise', current.bet);
            });

            clientController.$btnsendfold.on('click', () => {
                toggleHidden(min);
                action('fold', 0);
            });

        });

        socket.on('player-dealt-cards', (data) => {
            debug.delimit('player was dealt hole cards:');
            debug.logobject(data.a);
            debug.logobject(data.b);

            canvasView.clearAndResizeAll();

            current.table.tableView.registerCardDrawHandler(current.seat, data.a, data.b);
        });

        socket.on('flop-dealt', (data) => {
            debug.delimit('flop dealt');
            debug.logobject(data.a);
            debug.logobject(data.b);
            debug.logobject(data.c);

            canvasView.clearAndResizeAll();

            current.table.tableView.registerCommunityCardsDrawHandler(data.a, data.b, data.c);
        });

        socket.on('game-state', (data) => {
            debug.delimit('current game state');

            debug.logobject(data.potsize);
            debug.logobject(data.actionOn);
            debug.logobject(data.actionOn.player);

            current.table.tableView.registerActivePlayerSeatOutline(data.actionOn.seat);

            canvasView.clearAndResizeAll();
            current.table.redraw();
        });

        socket.on('table-state', (data) => {
            debug.delimit(`player seated in seat ${data.playerSeat} is in action`);
            debug.logobject(data);

            const centerlabel = `pot size: ${data.potsize}`;

            current.table.tableView.registerTableCenterLabelDrawHandler(centerlabel);
            current.table.seats.get(data.playerSeat).player.balance = data.updatedBalance;

            if (data.betAmount > 0) {
                current.game.playerPlacedBet(data.playerId, data.betAmount);

                const bets = current.game.getPlayerBets(data.playerId);

                debug.delimit('bets:');
                debug.logobject(bets);

                if (data.clearTable) {
                    setTimeout(() => {
                        canvasView.clearCanvas('chip-canvas');
                        current.table.tableView.clearHandlers('chip');
                        current.table.tableView.clearHandler('card', 'seat-active-player-outline');
                    }, 1500);
                } else {
                    current.table.tableView.registerChipDrawHandler(data.playerSeat, bets);
                }
            }

            socket.emit('poll-game-state', {
                tableid: current.table.id,
                gameid: current.game.id
            });

            canvasView.clearAndResizeAll();
            current.table.redraw();
        });
    }

    let renderLoop = null;

    {
        setTimeout(() => { // start
            setTimeout(() => { // update
                renderLoop = setInterval(() => {
                    current.table.render();
                }, tickrate, current.table, canvasView.getCanvas('table-canvas'));
            }, startupt);
        }, startupt);
    }

    debug.delimit('start up complete!', 'ready ...');

    $(window).on('resize', () => {
        canvasView.clearAndResizeAll();
        current.table.redraw();
    });
});