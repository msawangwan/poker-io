const drawChips = (t, i, b, e) => {
    t.seats.get(i).player.balance = b;
    t.drawChips(i, e);
    t.redraw();
};

const tickrate = 1000 / 2;
const startupt = 800;

const current = {
    player: null, table: null, seat: null
};

$(document).ready(() => {
    const debug = new HTMLLogger();

    const clientView = new ClientView();
    const canvasView = new CanvasView('container-canvas');

    const socket = io.connect(window.location.origin, {
        'reconnection': false
    });

    canvasView.clearAndResizeAll();
    clientView.hideAllButtons();

    clientView.$betrangeslider.on('change', () => {
        const slidervalue = clientView.$betrangeslider.val();
        clientView.$bettextfield.val(slidervalue);
    });

    {
        socket.on('connect', (data) => {
            current.table = new Table(9, canvasView);

            current.table.init();
            current.table.redraw();
        });

        socket.on('assigned-table', (data) => {
            current.player = new Player(data.guestname, socket.id, 0, canvasView.getCanvas('player-canvas'));

            current.seat = data.table.assignedSeat;

            current.table.assignedId = data.table.id;
            current.table.centerLabelText = 'waiting for players ...';

            current.table.seatPlayer(data.table.assignedSeat, current.player);
            current.table.seatOpponents(data.table.seatingState, socket.id);

            canvasView.clearAndResizeAll();

            current.table.drawTable_prototype();
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

            current.table.centerLabelText = 'pot size: 0';

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
                    clientView.$btnsendblind.toggle(clientView.$hidebtn);
                    clientView.$btnsendblind.val('post small blind');
                    clientView.$btnsendblind.on('click', () => {
                        socket.emit('post-blind', {
                            blindType: 'sb',
                            betAmount: data.blindBetSize / 2,
                            tableid: current.table.id,
                            gameid: current.table.game.id
                        });

                        clientView.$btnsendblind.toggle(clientView.$hidebtn);
                    });
                    break;
                case 'bb':
                    clientView.$btnsendblind.toggle(clientView.$hidebtn);
                    clientView.$btnsendblind.val('post big blind');
                    clientView.$btnsendblind.on('click', () => {
                        socket.emit('post-blind', {
                            blindType: 'bb',
                            betAmount: data.blindBetSize,
                            tableid: current.table.id,
                            gameid: current.table.game.id
                        });

                        clientView.$btnsendblind.toggle(clientView.$hidebtn);
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

            clientView.$btnsendcall.toggle(clientView.$hidebtn);
            clientView.$btnsendraise.toggle(clientView.$hidebtn);
            clientView.$btnsendfold.toggle(clientView.$hidebtn);

            clientView.$btnsendcall.val(`call ${data.minBetSize}`);
            clientView.$btnsendcall.on('click', () => {
                clientView.$btnsendcall.toggle(clientView.$hidebtn);
                clientView.$btnsendraise.toggle(clientView.$hidebtn);
                clientView.$btnsendfold.toggle(clientView.$hidebtn);

                action('call', data.minBetSize);
            });

            clientView.$btnsendraise.val(`raise ${'x'}`);
            clientView.$btnsendraise.on('click', () => {
                clientView.$btnsendcall.toggle(clientView.$hidebtn);
                clientView.$btnsendraise.toggle(clientView.$hidebtn);
                clientView.$btnsendfold.toggle(clientView.$hidebtn);

                action('raise', data.minBetSize);
            });

            clientView.$btnsendfold.on('click', () => {
                clientView.$btnsendcall.toggle(clientView.$hidebtn);
                clientView.$btnsendraise.toggle(clientView.$hidebtn);
                clientView.$btnsendfold.toggle(clientView.$hidebtn);

                action('fold', 0);
            });

        });

        socket.on('player-dealt-cards', (data) => {
            debug.delimit('player was dealt hole cards:');
            debug.logobject(data.a);
            debug.logobject(data.b);

            canvasView.clearAndResizeAll();

            current.table.drawCards(current.seat, data.a, data.b);
        });

        socket.on('flop-dealt', (data) => {
            debug.delimit('flop dealt');
            debug.logobject(data.a);
            debug.logobject(data.b);
            debug.logobject(data.c);

            canvasView.clearAndResizeAll();

            current.table.drawCommunityCards(data.a, data.b, data.c);
        });

        socket.on('update-table-state', (data) => {
            debug.delimit('player posted bet')
            debug.logobject(data);

            current.table.centerLabelText = `pot size: ${data.potsize}`;
            current.table.seats.get(data.playerSeat).player.balance = data.updatedBalance;

            canvasView.clearAndResizeAll();

            drawChips(current.table, data.playerSeat, data.updatedBalance, data.clearTable);
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