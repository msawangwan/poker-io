const tickrate = 1000 / 2;
const startupt = 800;

const nullchar = '\n';

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

    const parseBetAmountFromText = (t) => {
        return parseFloat(t.split(' ')[1]);
    };

    const toggleAvailableActions = (allowed) => {
        for (const a of allowed) {
            switch (a) {
                case 'postblind':
                    clientController.$btnsendblind.toggle(clientController.ids.hidebtn);
                    break;
                case 'bet':
                    clientController.$btnsendbet.toggle(clientController.ids.hidebtn);
                    break;
                case 'call':
                    clientController.$btnsendcall.toggle(clientController.ids.hidebtn);
                    break;
                case 'raise' || 'reraise':
                    clientController.$btnsendraise.toggle(clientController.ids.hidebtn);
                    clientController.$formbetrangeslider.toggle(clientController.ids.hidebtn);
                    break;
                case 'check':
                    clientController.$btnsendcheck.toggle(clientController.ids.hidebtn);
                    break;
                case 'fold':
                    clientController.$btnsendfold.toggle(clientController.ids.hidebtn);
                    break;
                default:
                    break;
            }
        }
    };

    const toggleUi = (actions) => {
        for (const a of actions) {
            switch (a) {
                case 'blind':
                    clientController.$btnsendblind.toggle(clientController.ids.hidebtn);
                    break;
                case 'bet':
                    clientController.$btnsendbet.toggle(clientController.ids.hidebtn);
                    break;
                case 'call':
                    clientController.$btnsendcall.toggle(clientController.ids.hidebtn);
                    break;
                case 'raise' || 'reraise':
                    clientController.$btnsendraise.toggle(clientController.ids.hidebtn);
                    clientController.$formbetrangeslider.toggle(clientController.ids.hidebtn);
                    break;
                case 'check':
                    clientController.$btnsendcheck.toggle(clientController.ids.hidebtn);
                    break;
                case 'fold':
                    clientController.$btnsendfold.toggle(clientController.ids.hidebtn);
                    break;
                default:
                    break;
            }
        }
    };

    const sendActionToServer = (round, type, orderindex, amount, tid, gid) => {
        socket.emit('player-completed-action', {
            round: round,
            actionType: type,
            betOrder: orderindex,
            betAmount: amount,
            tableid: tid,
            gameid: gid
        });
    };

    const enablePostBlindUI = (type, blindbet, tableid, gameid) => {
        const loc = `post ${type === 'sb' ? 'small' : 'big'} blind`;
        const order = type === 'sb' ? 0 : 1;

        toggleAvailableActions(['postblind']);

        actionConsole.log(`posting blind! amount: ${blindbet}`);

        clientController.$btnsendblind.val(`${loc}`);
        clientController.$btnsendblind.on('click', () => {
            toggleAvailableActions(['postblind']);
            sendActionToServer('blind', 'check', order, blindbet, tableid, gameid);
        });
    };

    const enablePostBetUI = (round, order, allowedactions, minbet, blindbet, tableid, gameid) => {
        toggleAvailableActions(allowedactions);

        let bet = minbet;

        clientController.$btnsendbet.val(`bet ${minbet}`);
        clientController.$btnsendbet.on('click', () => {
            bet = parseBetAmountFromText(clientController.$btnsendbet.val());
            toggleAvailableActions(allowedactions);
            sendActionToServer(round, 'bet', order, bet, tableid, gameid);
        });

        clientController.$btnsendcheck.val('check');
        clientController.$btnsendcheck.on('click', () => {
            bet = 0;
            toggleAvailableActions(allowedactions);
            sendActionToServer(round, 'check', order, bet, tableid, gameid);
        });

        clientController.$btnsendcall.val(`call ${minbet}`);
        clientController.$btnsendcall.on('click', () => {
            bet = minbet;
            toggleAvailableActions(allowedactions);
            sendActionToServer(round, 'call', order, bet, tableid, gameid);
        });

        clientController.$btnsendraise.val(`raise ${minbet ? minbet : blindbet}`);
        clientController.$btnsendraise.on('click', () => {
            bet = parseBetAmountFromText(clientController.$btnsendraise.val());
            toggleAvailableActions(allowedactions);
            sendActionToServer(round, 'raise', order, bet, tableid, gameid);
        });

        clientController.$btnsendfold.on('click', () => {
            bet = 0;
            toggleAvailableActions(allowedactions);
            sendActionToServer(round, 'fold', order, bet, tableid, gameid);
        });
    };

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
            current.table.tableView.registerTableDrawHandler();

            canvasView.clearAndResizeAll();
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
                'game started',
                `id: ${data.gameId}`,
                `name: ${current.player.name}`,
                `seat: ${current.seat}`,
                `id: ${socket.id}`,
                `button index: ${current.table.buttonIndex}`,
                `small blind index: ${current.table.sbIndex}`,
                `big blind index: ${current.table.bbIndex}`,
                nullchar,
            );
        });

        socket.on('turn', (data) => {
            const round = data.game.state.name;
            const actions = data.turn.actions;
            const minbet = data.turn.owes;
            const orderIndex = data.turn.betOrderIndex;
            const tableid = current.table.id;
            const gameid = current.game.id;

            let loc = 'post small blind';

            if (orderIndex === '1') {
                loc = 'post big blind';
            }

            toggleUi(actions);

            let bet = minbet;

            clientController.$btnsendblind.val(`${loc}`);
            clientController.$btnsendblind.on('click', () => {
                toggleUi(['postblind']);
                sendActionToServer('blind', 'check', order, bet, tableid, gameid);
            });

            clientController.$btnsendbet.val(`bet ${minbet}`);
            clientController.$btnsendbet.on('click', () => {
                bet = parseBetAmountFromText(clientController.$btnsendbet.val());
                toggleUi(actions);
                sendActionToServer(round, 'bet', order, bet, tableid, gameid);
            });

            clientController.$btnsendcheck.val('check');
            clientController.$btnsendcheck.on('click', () => {
                bet = 0;
                toggleUi(actions);
                sendActionToServer(round, 'check', order, bet, tableid, gameid);
            });

            clientController.$btnsendcall.val(`call ${minbet}`);
            clientController.$btnsendcall.on('click', () => {
                bet = minbet;
                toggleUi(actions);
                sendActionToServer(round, 'call', order, bet, tableid, gameid);
            });

            clientController.$btnsendraise.val(`raise ${minbet ? minbet : blindbet}`);
            clientController.$btnsendraise.on('click', () => {
                bet = parseBetAmountFromText(clientController.$btnsendraise.val());
                toggleUi(actions);
                sendActionToServer(round, 'raise', order, bet, tableid, gameid);
            });

            clientController.$btnsendfold.on('click', () => {
                bet = 0;
                toggleUi(actions);
                sendActionToServer(round, 'fold', order, bet, tableid, gameid);
            });
        });

        socket.on('pass-action-to-player', (data) => {
            actionConsole.log(
                `action was passed to you`,
                `id: ${socket.id}`,
                `name: ${current.player.name}`,
                `seat: ${data.seat}`,
                `bet order: ${data.order}`,
                `betting round: ${data.round}`,
                `potsize: ${data.potsize}`,
                `minbet: ${data.minbet}`,
                `actions allowed: ${data.actions}`,
                nullchar
            );

            switch (data.round) {
                case 'blind':
                    const b = data.order === 0 ? 'sb' : 'bb';
                    // const bb = b === 'sb' ? data.minbet * 0.5 : data.minbet;
                    const bb = data.minbet;

                    if (!data.acted) {
                        enablePostBlindUI(
                            b,
                            bb,
                            current.table.id,
                            current.game.id
                        );
                    }

                    break;
                case 'deal':
                    if (!data.acted) {
                        actionConsole.log(`this is your second action!`, nullchar);
                    }

                    enablePostBetUI(
                        data.round,
                        data.order,
                        data.actions,
                        data.minbet,
                        10, // todo: get from server
                        current.table.id,
                        current.game.id
                    );

                    break;
                case 'flop':
                    enablePostBetUI(
                        data.round,
                        data.order,
                        data.acttions,
                        data.minbet,
                        10, // todo: get from server
                        current.table.id,
                        current.game.id
                    );

                    break;
                default:
                    break;
            }
        });

        socket.on('player-dealt-cards', (data) => {
            actionConsole.log(
                'player dealt hole cards:',
                `suite: ${data.a.suite}`,
                `value: ${data.a.value}`,
                `suite: ${data.b.suite}`,
                `value: ${data.b.value}`,
                nullchar
            );

            current.table.tableView.registerCardDrawHandler(current.seat, data.a, data.b);

            socket.emit('poll-game-state', {
                tableid: current.table.id,
                gameid: current.game.id
            });
        });

        socket.on('flop-dealt', (data) => {
            actionConsole.log(
                'flop dealt',
                `suite: ${data.a.suite}`,
                `value: ${data.a.value}`,
                `suite: ${data.b.suite}`,
                `value: ${data.b.value}`,
                `suite: ${data.c.suite}`,
                `value: ${data.c.value}`,
                nullchar
            );

            canvasView.clearAndResizeAll();

            current.table.tableView.registerActivePlayerSeatOutline(data.utg);
            current.table.tableView.registerCommunityCardsDrawHandler(data.a, data.b, data.c);

            socket.emit('poll-game-state', {
                tableid: current.table.id,
                gameid: current.game.id
            });
        });

        socket.on('game-state', (data) => {
            actionConsole.log(
                `*game state*`,
                `turn id: -1`,
                `*player in action*`,
                `name: ${data.actionOn.player.name}`,
                `id: ${data.actionOn.player.id}`,
                `seat: ${data.actionOn.seat}`,
                `*hand info*`,
                `round: ${data.hand.round}`,
                `betting round count: ${data.hand.roundsbet}`,
                `anchor id: ${data.hand.anchor}`,
                `pot: ${data.potsize}`,
                nullchar
            );

            canvasView.clearAndResizeAll();

            current.table.tableView.registerActivePlayerSeatOutline(data.actionOn.seat);
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
        'lobby loaded',
        'waiting for game start ...',
        nullchar
    );

    $(window).on('resize', () => {
        canvasView.clearAndResizeAll();
        current.table.redraw();
    });
});