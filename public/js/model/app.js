const mns = { app: {} };

mns.app.round = (n, precision) => {
    const factor = Math.pow(10, precision);
    return Math.round(n * factor) / factor;
};

const convert = v => v * 0.01;
const slideincr = 5;
const tickrate = 1000 / 2;
const startupt = 800;

const nullchar = '\n';

const current = {
    player: null,
    other: {
        folded: [],
    },
    table: null,
    game: null,
    seat: null,
    hand: {
        a: null,
        b: null
    },
    community: {
        a: null,
        b: null,
        c: null,
        d: null,
        e: null
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

    const $ui = clientController.$toggledUi;

    canvasView.clearAndResizeAll();

    clientController.deactiveGroup($ui);

    clientController.callbackHandlers.get('bet-range-slider').set('update-button-txt', val => {
        current.bet = current.player.balance * convert(val);
        current.bet = mns.app.round(current.bet, 2);

        clientController.$btnsendbet.val(`bet ${current.bet}`);
        clientController.$btnsendraise.val(`raise ${current.bet}`);
    });

    clientController.callbackHandlers.get('bet-range-slider-btn-minus').set('calc-minus', v => {
        console.log('val before minus', v);
        clientController.$betrangeslider.val(v - slideincr);
        console.log('after', clientController.$betrangeslider.val());
    });

    clientController.callbackHandlers.get('bet-range-slider-btn-plus').set('calc-plus', v => {
        // console.log('val before add', v);
        // clientController.$betrangeslider.val(v + slideincr);
        // console.log('after', clientController.$betrangeslider.val());
        const arg = v;
        console.log('arg parameter sent from cb handler:', v);
        const target = v + 5;
        console.log('arg parameter modified witrh incr:', target);
        console.log('current v actual before:', clientConttroller.$betrangeslider.val());
        const inplace = clientController.$betrangeslider.val() + 5;
        console.log('in place mod',inplace);
    });

    const parseBetAmountFromText = (t) => {
        return parseFloat(t.split(' ')[1]);
    };

    const validateBalance = (local, remote) => {
        if (local !== remote) {
            return remote;
        }
        return local;
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
        socket.on('connect', data => {
            current.table = new Table(9, canvasView);

            current.table.init();
            current.table.redraw();
        });

        socket.on('assigned-table', data => {
            current.balance = data.balance;
            current.player = new Player(data.guestname, socket.id, current.balance, canvasView.getCanvas('player-canvas'));
            current.seat = data.table.assignedSeat;
            current.table.assignedId = data.table.id;
            current.table.tableView.registerTableCenterLabelDrawHandler('waiting for players ...');
            current.table.seatPlayer(data.table.assignedSeat, current.player);
            current.table.seatOpponents(data.table.seatingState, socket.id);
            current.table.tableView.registerTableDrawHandler();

            canvasView.clearAndResizeAll();
        });

        socket.on('a-player-has-joined', data => {
            current.table.seatOpponents(data.table.seatingState, socket.id);
            canvasView.clearAndResizeAll();
        });

        socket.on('game-started', data => {
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

        socket.on('enter-turn', data => {
            const round = data.game.state.name;
            const balance = data.player.balance;
            const actions = data.turn.actions;
            const minbet = data.turn.owes;
            const orderIndex = data.turn.index;
            const turnid = data.game.turnId;
            const tableid = current.table.id;
            const gameid = current.game.id;

            current.balance = validateBalance(current.balance, balance);

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
                        clientController.$btnsendblind.on('click', e => {
                            completeTurn('blind', bet);

                            clientController.deactiveGroup(clientController.$toggledUi);

                            return false;
                        });

                        break;
                    case 'bet':
                        clientController.setActive(clientController.$btnsendbet);

                        clientController.$btnsendbet.val(`bet ${minbet}`);
                        clientController.$btnsendbet.on('click', e => {
                            bet = parseBetAmountFromText(clientController.$btnsendbet.val());

                            completeTurn('bet', bet);

                            clientController.deactiveGroup(clientController.$toggledUi);

                            return false;
                        });

                        break;
                    case 'call':
                        clientController.setActive(clientController.$btnsendcall);

                        clientController.$btnsendcall.val(`call ${minbet}`);
                        clientController.$btnsendcall.on('click', e => {
                            bet = parseBetAmountFromText(clientController.$btnsendcall.val());

                            completeTurn('call', bet);

                            clientController.deactiveGroup(clientController.$toggledUi);

                            return false;
                        });

                        break;
                    case 'raise' || 'reraise':
                        clientController.setActive(clientController.$btnsendraise);
                        clientController.setActive(clientController.$formbetrangeslider);

                        clientController.$btnsendraise.val(`raise ${minbet * 2}`);
                        clientController.$btnsendraise.on('click', e => {
                            bet = parseBetAmountFromText(clientController.$btnsendraise.val());

                            completeTurn('raise', bet);

                            clientController.deactiveGroup(clientController.$toggledUi);

                            return false;
                        });

                        break;
                    case 'check':
                        clientController.setActive(clientController.$btnsendcheck);

                        clientController.$btnsendcheck.val('check');
                        clientController.$btnsendcheck.on('click', e => {
                            bet = 0;

                            completeTurn('check', bet);

                            clientController.deactiveGroup(clientController.$toggledUi);

                            return false;
                        });

                        break;
                    case 'fold':
                        clientController.setActive(clientController.$btnsendfold);

                        clientController.$btnsendfold.on('click', e => {
                            bet = 0;

                            completeTurn('fold', bet);

                            clientController.deactiveGroup(clientController.$toggledUi);

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
            const foldedIds = data.player.other.foldedIds;

            actionConsole.log(
                `game state`,
                `turn id: ${data.game.turnId}`,
                `round: ${data.game.state}`,
                `pot total: ${data.pot.size}`,
                `pot current: ${data.pot.current}`,
                `acting: ${data.player.acting.id}`,
                `acting seat: ${data.player.acting.order}`,
                `folded players: ${foldedIds.length ? foldedIds : 'none'}`,
                nullchar
            );

            if (foldedIds.length && (current.hand.a || current.hand.b)) {
                current.table.tableView.registerCardBackDrawHandler(current.player.id, ...foldedIds);
            }

            canvasView.clearAndResizeAll();

            current.balance = validateBalance(current.balance, data.player.client.balance);

            current.table.tableView.registerTableCenterLabelDrawHandler(`Pot: ${data.pot.size} Current Hand: ${data.pot.current}`);
            current.table.tableView.registerActivePlayerSeatOutline(data.player.acting.order);
            current.table.redraw();
        });

        socket.on('deal-player-cards', data => {
            const c1 = data.cards.a;
            const c2 = data.cards.b;

            actionConsole.log(
                `player hand:`,
                `${Card.stringify(c1)}`,
                `${Card.stringify(c2)}`,
                nullchar
            );

            current.hand.a = c1;
            current.hand.b = c2;

            current.table.tableView.registerCardDrawHandler(current.seat, c1, c2);
            current.table.tableView.registerCardBackDrawHandler(current.player.id);
        });

        socket.on('deal-community-cards', data => {
            const round = data.round;
            const dealt = data.cards;

            switch (round) {
                case 'flop':
                    current.community.a = dealt[0];
                    current.community.b = dealt[1];
                    current.community.c = dealt[2];
                    break;
                case 'turn':
                    current.community.d = dealt[0];
                    break;
                case 'river':
                    current.community.e = dealt[0];
                    break;
                default:
                    console.error('invalid community card and/or round!');
                    break;
            }

            {
                actionConsole.log(`community cards dealt`, `round: ${round}`);

                for (const c of dealt) {
                    actionConsole.log(`${Card.stringify(c)}`);
                }
            }

            const community = [];

            if (current.community.a) {
                community.push(current.community.a);
            }

            if (current.community.b) {
                community.push(current.community.b);
            }

            if (current.community.c) {
                community.push(current.community.c);
            }

            if (current.community.d) {
                community.push(current.community.d);
            }

            if (current.community.e) {
                community.push(current.community.e);
            }

            canvasView.clearAndResizeAll();

            current.table.tableView.registerActivePlayerSeatOutline(0);
            current.table.tableView.registerCommunityCardsDrawHandler(...community);
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