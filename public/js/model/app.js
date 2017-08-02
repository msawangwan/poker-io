const tickrate = 1000 / 2;
const startupt = 800;

const current = {
    player: null, table: null, seat: null
};

$(document).ready(() => {
    const clientController = new ClientController();
    const canvasView = new CanvasView('container-canvas');
    const debug = new HTMLLogger();

    const socket = io.connect(window.location.origin, {
        'reconnection': false
    });

    canvasView.clearAndResizeAll();

    clientController.hideAllButtons();
    clientController.$betrangeslider.on('change', () => {
        const slidervalue = clientController.$betrangeslider.val();
        clientController.$bettextfield.val(slidervalue);
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
            current.table.game = new Game(data.gameId, current.table.players);

            current.table.buttonIndex = data.buttonIndex;
            current.table.sbIndex = (data.buttonIndex + 1 % current.table.playerCount) % current.table.playerCount;
            current.table.bbIndex = (data.buttonIndex + 2 % current.table.playerCount) % current.table.playerCount;

            current.table.tableView.registerButtonDrawHandler('dealer', current.table.buttonIndex);
            current.table.tableView.registerButtonDrawHandler('sb', current.table.sbIndex);
            current.table.tableView.registerButtonDrawHandler('bb', current.table.bbIndex);

            current.table.tableView.registerTableCenterLabelDrawHandler('game starting ...');

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
                    clientController.$btnsendblind.toggle(clientController.$hidebtn);
                    clientController.$btnsendblind.val('post small blind');
                    clientController.$btnsendblind.on('click', () => {
                        socket.emit('post-blind', {
                            blindType: 'sb',
                            betAmount: data.blindBetSize / 2,
                            tableid: current.table.id,
                            gameid: current.table.game.id
                        });

                        clientController.$btnsendblind.toggle(clientController.$hidebtn);
                    });
                    break;
                case 'bb':
                    clientController.$btnsendblind.toggle(clientController.$hidebtn);
                    clientController.$btnsendblind.val('post big blind');
                    clientController.$btnsendblind.on('click', () => {
                        socket.emit('post-blind', {
                            blindType: 'bb',
                            betAmount: data.blindBetSize,
                            tableid: current.table.id,
                            gameid: current.table.game.id
                        });

                        clientController.$btnsendblind.toggle(clientController.$hidebtn);
                    });
                    break;
                default:
                    break;
            }
        });

        socket.on('collect-ante', (data) => {
            {
                debug.delimit(
                    `${current.player.name} ante up!`,
                );

                debug.logobject(data);
            }

            debug.delimit('action is open and on you', 'bet', 'check', 'fold');

            let action = (type, amount) => {
                socket.emit('post-ante', {
                    betType: type,
                    betAmount: amount,
                    tableid: current.table.id,
                    gameid: current.table.game.id
                });
            };

            clientController.$btnsendcall.toggle(clientController.$hidebtn);
            clientController.$btnsendraise.toggle(clientController.$hidebtn);
            clientController.$btnsendfold.toggle(clientController.$hidebtn);

            clientController.$btnsendcall.val(`call ${data.minBetSize}`);
            clientController.$btnsendcall.on('click', () => {
                clientController.$btnsendcall.toggle(clientController.$hidebtn);
                clientController.$btnsendraise.toggle(clientController.$hidebtn);
                clientController.$btnsendfold.toggle(clientController.$hidebtn);

                action('call', data.minBetSize);
            });

            clientController.$btnsendraise.val(`raise ${'x'}`);
            clientController.$btnsendraise.on('click', () => {
                clientController.$btnsendcall.toggle(clientController.$hidebtn);
                clientController.$btnsendraise.toggle(clientController.$hidebtn);
                clientController.$btnsendfold.toggle(clientController.$hidebtn);

                action('raise', data.minBetSize);
            });

            clientController.$btnsendfold.on('click', () => {
                clientController.$btnsendcall.toggle(clientController.$hidebtn);
                clientController.$btnsendraise.toggle(clientController.$hidebtn);
                clientController.$btnsendfold.toggle(clientController.$hidebtn);

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

        socket.on('update-table-state', (data) => {
            debug.delimit('player posted bet')
            debug.logobject(data);

            const centerlabel = `pot size: ${data.potsize}`;

            current.table.tableView.registerTableCenterLabelDrawHandler(centerlabel);
            current.table.seats.get(data.playerSeat).player.balance = data.updatedBalance;

            if (data.clearTable) {
                setTimeout(() => {
                    canvasView.clearCanvas('chip-canvas');
                    current.table.tableView.clearHandlers('chip');
                }, 500);
            } else {
                current.table.tableView.registerChipDrawHandler(data.playerSeat);
            }

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