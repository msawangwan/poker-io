const mns = { app: {} };

mns.app.round = (n, precision) => {
    const factor = Math.pow(10, precision);
    return Math.round(n * factor) / factor;
};

const tickrate = 1000 / 2;
const startupt = 800;

const nullchar = '\n';

const current = {
    player: null,
    table: null,
    game: null,
    seat: null,
    hand: {
        a: null,
        b: null
    },
    balance: 0,
    bet: 0
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
        current.bet = mns.app.round(current.bet, 2);

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
            const turnid = data.game.turnId;
            const tableid = current.table.id;
            const gameid = current.game.id;

            actionConsole.log(
                `${current.player.name}'s turn`,
                `turn id: ${turnid}`,
                `bet order index: ${orderIndex}`,
                `available actions ${actions}`,
                `match amount: ${minbet}`,
                nullchar
            );

            let bet = minbet;

            for (const a of actions) {
                switch (a) {
                    case 'blind':
                        let loc = 'post small blind';

                        if (orderIndex === 1) {
                            loc = 'post big blind';
                        }

                        clientController.setActive(clientController.$btnsendblind);

                        clientController.$btnsendblind.val(`${loc}`);
                        clientController.$btnsendblind.on('click', (e) => {
                            completeTurn('blind', bet);
                            clientController.deactiveGroup(clientController.$allbtns);

                            return false;
                        });

                        break;
                    case 'bet':
                        clientController.setActive(clientController.$btnsendbet);

                        clientController.$btnsendbet.val(`bet ${minbet}`);
                        clientController.$btnsendbet.on('click', (e) => {
                            bet = parseBetAmountFromText(clientController.$btnsendbet.val());

                            completeTurn('bet', bet);
                            clientController.deactiveGroup(clientController.$allbtns);

                            return false;
                        });

                        break;
                    case 'call':
                        clientController.setActive(clientController.$btnsendcall);

                        clientController.$btnsendcall.val(`call ${minbet}`);
                        clientController.$btnsendcall.on('click', (e) => {
                            bet = parseBetAmountFromText(clientController.$btnsendcall.val());

                            completeTurn('call', bet);
                            clientController.deactiveGroup(clientController.$allbtns);

                            return false;
                        });

                        break;
                    case 'raise' || 'reraise':
                        clientController.setActive(clientController.$btnsendraise);
                        clientController.setActive(clientController.$formbetrangeslider);

                        clientController.$btnsendraise.val(`raise ${minbet * 2}`);
                        clientController.$btnsendraise.on('click', (e) => {
                            bet = parseBetAmountFromText(clientController.$btnsendraise.val());

                            completeTurn('raise', bet);

                            clientController.deactiveGroup(clientController.$allbtns);
                            clientController.setActive(clientController.$formbetrangeslider);

                            return false;
                        });

                        break;
                    case 'check':
                        clientController.setActive(clientController.$btnsendcheck);

                        clientController.$btnsendcheck.val('check');
                        clientController.$btnsendcheck.on('click', (e) => {
                            bet = 0;

                            completeTurn('check', bet);
                            clientController.deactiveGroup(clientController.$allbtns);

                            return false;
                        });

                        break;
                    case 'fold':
                        clientController.setActive(clientController.$btnsendfold);

                        clientController.$btnsendfold.on('click', (e) => {
                            bet = 0;

                            completeTurn('fold', bet);
                            clientController.deactiveGroup(clientController.$allbtns);

                            current.table.tableView.registerCardDrawHandler(
                                current.seat,
                                current.hand.a,
                                current.hand.b,
                                true
                            );

                            return false;
                        });

                        break;
                    default:
                        console.log('invalid action!');
                        break;
                }
            }
        });

        socket.on('state', (data) => {
            actionConsole.log(
                `game state`,
                `turn id: ${data.game.turnId}`,
                `round: ${data.game.state}`,
                `pot total: ${data.pot.size}`,
                `pot current: ${data.pot.current}`,
                `acting: ${data.player.acting.id}`,
                `acting seat: ${data.player.acting.order}`,
                nullchar
            );

            canvasView.clearAndResizeAll();

            current.table.tableView.registerTableCenterLabelDrawHandler(`Pot: ${data.pot.size} Current Hand: ${data.pot.current}`);
            current.table.tableView.registerActivePlayerSeatOutline(data.player.acting.order);
            current.table.redraw();
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

            current.hand.a = data.a;
            current.hand.b = data.b;

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