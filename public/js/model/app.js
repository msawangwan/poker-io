const tickrate = 1000 / 2;
const startupt = 800;

const current = {
    player: null, table: null, game: null, seat: null, balance: 0, bet: 0
};

$(document).ready(() => {
    const clientController = new ClientController();
    const canvasView = new CanvasView('container-canvas');
    const actionConsole = new HTMLLogger();

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

        socket.on('assigned-table', (data) => {
            current.balance = 500; // TODO: get from server
            current.player = new Player(data.guestname, socket.id, current.balance, canvasView.getCanvas('player-canvas'));

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
            { // todo: deprecate
                current.table.game = new Game(data.gameId, current.table.players);
                current.table.buttonIndex = data.buttonIndex;
                current.table.sbIndex = (data.buttonIndex + 1 % current.table.playerCount) % current.table.playerCount;
                current.table.bbIndex = (data.buttonIndex + 2 % current.table.playerCount) % current.table.playerCount;
            }

            current.game = current.table.game; // use this instead of current.table.game (new Game(data.gameId, current.table.players))
            current.game.theButton = data.buttonIndex;
            current.game.theSmallBlind = (data.buttonIndex + 1 % current.table.playerCount) % current.table.playerCount;
            current.game.theBigBlind = (data.buttonIndex + 2 % current.table.playerCount) % current.table.playerCount;

            current.table.tableView.registerButtonDrawHandler('dealer', current.table.buttonIndex);
            current.table.tableView.registerButtonDrawHandler('sb', current.table.sbIndex);
            current.table.tableView.registerButtonDrawHandler('bb', current.table.bbIndex);

            current.table.tableView.registerTableCenterLabelDrawHandler('game starting ...');

            socket.emit('poll-game-state', {
                tableid: current.table.id,
                gameid: data.gameId
            });

            actionConsole.log(
                `==`,
                'game started',
                `id: ${data.gameId}`,
                `==`,
                `id: ${socket.id}`,
                `name: ${current.player.name}`,
                `seat: ${current.seat}`,
                `button index: ${current.table.buttonIndex}`,
                `small blind index: ${current.table.sbIndex}`,
                `big blind index: ${current.table.bbIndex}`,
                `==`,
            );
        });


        socket.on('collect-blind', (data) => {
            const loc = `post ${data.blindType === 'sb' ? 'small' : 'big'} blind`;
            const blindbet = data.blindType === 'sb' ? data.blindBetSize * 0.5 : data.blindBetSize;

            actionConsole.log(
                `==`,
                `player: ${current.player.name} action is on you`,
                `id: ${socket.id}`,
                `==`,
                `${loc}`,
                `==`
            );

            clientController.$btnsendblind.toggle(clientController.ids.hidebtn);
            clientController.$btnsendblind.val(`${loc}`);

            clientController.$btnsendblind.on('click', () => {
                socket.emit('post-blind', {
                    blindType: data.blindType,
                    betAmount: blindbet,
                    tableid: current.table.id,
                    gameid: current.table.game.id
                });

                clientController.$btnsendblind.toggle(clientController.ids.hidebtn);
            });
        });

        socket.on('collect-ante', (data) => {
            {
                actionConsole.log(
                    `${current.player.name} action on you ...`, `... the last player did: ${data.actionType}`
                );

                actionConsole.logobject(data);
            };

            let min = data.minBetAmount;

            const previousBets = current.game.getPlayerBets(socket.id);

            if (previousBets) {
                const lastBet = previousBets[previousBets.length - 1];

                actionConsole.log(`last bet was ${lastBet}`);

                min = Math.abs(lastBet - data.minBetAmount);
            }

            actionConsole.log(`min bet allowed is ${min}`);

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

            if (min <= 0) {
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
            actionConsole.log('player was dealt hole cards:');
            actionConsole.logobject(data.a);
            actionConsole.logobject(data.b);

            canvasView.clearAndResizeAll();

            current.table.tableView.registerCardDrawHandler(current.seat, data.a, data.b);
        });

        socket.on('flop-dealt', (data) => {
            actionConsole.log('flop dealt');

            actionConsole.logobject(data.a);
            actionConsole.logobject(data.b);
            actionConsole.logobject(data.c);

            canvasView.clearAndResizeAll();

            current.table.tableView.registerActivePlayerSeatOutline(data.utg);
            current.table.tableView.registerCommunityCardsDrawHandler(data.a, data.b, data.c);

            socket.emit('poll-game-state', {
                tableid: current.table.id,
                gameid: current.game.id
            });
        });

        socket.on('game-state', (data) => {
            actionConsole.log('current game state');

            actionConsole.logobject(data.potsize);
            actionConsole.logobject(data.actionOn);
            actionConsole.logobject(data.actionOn.player);

            current.table.tableView.registerActivePlayerSeatOutline(data.actionOn.seat);

            canvasView.clearAndResizeAll();
            current.table.redraw();
        });

        socket.on('table-state', (data) => {
            actionConsole.log(`player seated in seat ${data.playerSeat} is in action`);
            actionConsole.logobject(data);

            const centerlabel = `pot size: ${data.potsize}`;

            current.table.tableView.registerTableCenterLabelDrawHandler(centerlabel);
            current.table.seats.get(data.playerSeat).player.balance = data.updatedBalance;

            if (data.betAmount > 0) {
                current.game.playerPlacedBet(data.playerId, data.betAmount);

                const bets = current.game.getPlayerBets(data.playerId);

                actionConsole.log('bets:');
                actionConsole.logobject(bets);

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

    actionConsole.log(
        `==`,
        'lobby loaded',
        `==`,
        `==`,
        'waiting for more players to start ...',
        `==`,
    );

    $(window).on('resize', () => {
        canvasView.clearAndResizeAll();
        current.table.redraw();
    });
});