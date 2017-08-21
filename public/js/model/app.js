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

    const completeTurn = (actionType, betAmount) => {
        socket.emit('exit-turn', {
            tableId: current.table.id,
            gameId: current.game.id,
            actionType: actionType,
            betAmount: betAmount
        });
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

            actionConsole.log(
                'game started',
                `id: ${data.gameId}`,
                `name: ${current.player.name}`,
                `seat: ${current.seat}`,
                `id: ${socket.id}`,
                `dealer button index: ${current.table.buttonIndex}`,
                nullchar,
            );
        });

        socket.on('enter-turn', (data) => {
            const round = data.game.state.name;
            const actions = data.turn.actions;
            const minbet = data.turn.owes;
            const orderIndex = data.turn.index;
            const tableid = current.table.id;
            const gameid = current.game.id;

            actionConsole.log(
                `${current.player.name}'s turn`,
                `bet order index: ${orderIndex}`,
                `available actions ${actions}`,
                nullchar
            );

            let loc = 'post small blind';

            if (orderIndex === 1) {
                loc = 'post big blind';
            }

            toggleUi(actions);

            let bet = minbet;

            clientController.$btnsendblind.val(`${loc}`);
            clientController.$btnsendblind.on('click', () => {
                toggleUi(actions);
                completeTurn('check', bet);
            });

            clientController.$btnsendbet.val(`bet ${minbet}`);
            clientController.$btnsendbet.on('click', () => {
                bet = parseBetAmountFromText(clientController.$btnsendbet.val());
                toggleUi(actions);
                completeTurn('bet', bet);
            });

            clientController.$btnsendcheck.val('check');
            clientController.$btnsendcheck.on('click', () => {
                bet = 0;
                toggleUi(actions);
                completeTurn('check', bet);
            });

            clientController.$btnsendcall.val(`call ${minbet}`);
            clientController.$btnsendcall.on('click', () => {
                toggleUi(actions);
                completeTurn('call', bet);
            });

            clientController.$btnsendraise.val(`raise ${minbet * 2}`);
            clientController.$btnsendraise.on('click', () => {
                bet = parseBetAmountFromText(clientController.$btnsendraise.val());
                toggleUi(actions);
                completeTurn('raise', bet);
            });

            clientController.$btnsendfold.on('click', () => {
                bet = 0;
                toggleUi(actions);
                completeTurn('fold', bet);
            });
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
        });

        socket.on('state', (data) => {
            actionConsole.log(
                `game state`,
                `round: ${data.game.state}`,
                `pot total: ${data.pot.size}`,
                `pot current: ${data.pot.current}`,
                nullchar
            );

            canvasView.clearAndResizeAll();

            current.table.tableView.registerActivePlayerSeatOutline(data.player.acting.order);
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