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
                nullchar,
                `name: ${current.player.name}`,
                `seat: ${current.seat}`,
                `id: ${socket.id}`,
                nullchar,
                `button index: ${current.table.buttonIndex}`,
                `small blind index: ${current.table.sbIndex}`,
                `big blind index: ${current.table.bbIndex}`,
                nullchar,
            );
        });

        socket.on('pass-action-to-player', (data) => {
            actionConsole.log(
                `action was passed to you`,
                `id: ${socket.id}`,
                `name: ${current.player.name}`,
                `seat: ${data.seat}`,
                `has acted: ${data.acted}`,
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
                    const bb = b === 'sb' ? data.minbet * 0.5 : data.minbet;

                    if (!data.acted) {
                        allowPlayerToPostBlind(b, bb, current.table.id, current.game.id);
                    }

                    break;
                case 'deal':
                    break;
                default:
                    break;
            }
        });

        const allowPlayerToPostBlind = (type, blindbet, tableid, gameid) => {
            const loc = `post ${type === 'sb' ? 'small' : 'big'} blind`;
            const order = type === 'sb' ? 0 : 1;

            clientController.$btnsendblind.toggle(clientController.ids.hidebtn);
            clientController.$btnsendblind.val(`${loc}`);

            clientController.$btnsendblind.on('click', () => {
                socket.emit('player-completed-action', {
                    round: 'blind',
                    actionType: 'bet',
                    betOrder: order,
                    betAmount: blindbet,
                    tableid: tableid,
                    gameid: gameid
                });

                clientController.$btnsendblind.toggle(clientController.ids.hidebtn);
            });
        };

        socket.on('collect-blind', (data) => {
            const loc = `post ${data.blindType === 'sb' ? 'small' : 'big'} blind`;
            const blindbet = data.blindType === 'sb' ? data.blindBetSize * 0.5 : data.blindBetSize;

            actionConsole.log(
                `${current.player.name} action is on you`,
                `${socket.id}`,
                nullchar,
                `${loc}`,
                nullchar
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
            actionConsole.log(
                `${current.player.name} post ante`,
                nullchar
            );

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

            const toggleAvailableActions = (allowed) => {
                actionConsole.log('toggling allowed actions:');

                for (const a of allowed) {
                    actionConsole.log(`${a}`);

                    switch (a) {
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

                actionConsole.log(nullchar);
            };

            toggleAvailableActions(data.allowedActions);

            clientController.$btnsendcheck.on('click', () => {
                toggleAvailableActions(data.allowedActions);
                action('check', 0);
            });

            clientController.$btnsendcall.val(`call ${min}`);
            clientController.$btnsendcall.on('click', () => {
                toggleAvailableActions(data.allowedActions);
                action('call', current.bet);
            });

            clientController.$btnsendraise.val(`raise ${data.minBetAmount}`);
            clientController.$btnsendraise.on('click', () => {
                toggleAvailableActions(data.allowedActions);
                action('raise', current.bet);
            });

            clientController.$btnsendfold.on('click', () => {
                toggleAvailableActions(data.allowedActions);
                action('fold', 0);
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
            canvasView.clearAndResizeAll();
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
                `game state`,
                `turn id: -1`,
                nullchar,
                `player in action:`,
                `name: ${data.actionOn.player.name}`,
                `id: ${data.actionOn.player.id}`,
                `seat: ${data.actionOn.seat}`,
                nullchar,
                `hand info:`,
                `phase: ${data.hand.phase}`,
                `round: ${data.hand.round}`,
                `pot: ${data.potsize}`,
                nullchar
            );

            canvasView.clearAndResizeAll();

            current.table.tableView.registerActivePlayerSeatOutline(data.actionOn.seat);
            current.table.redraw();
        });

        socket.on('table-state', (data) => {
            actionConsole.log(
                `table state`,
                `table id: ${current.table.id}`,
                `action on seat ${data.playerSeat}`,
                nullchar
            );

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
        'lobby loaded',
        'waiting for game start ...',
        nullchar
    );

    $(window).on('resize', () => {
        canvasView.clearAndResizeAll();
        current.table.redraw();
    });
});