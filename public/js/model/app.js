const resizeCanvases = (parentCanvasId, canvasEleGroup) => {
    const parentEle = document.getElementById(parentCanvasId);

    const w = parentEle.offsetWidth;
    const h = parentEle.offsetHeight;

    for (const c of canvasEleGroup) {
        c.width = w;
        c.height = h;
    }
};

const drawChips = (t, i, b) => {
    t.seats.get(i).player.balance = b;
    t.drawChips(i);
    t.redraw();
};

const canvasLayerIds = ['static-canvas', 'dynamic-canvas', 'label-canvas'];
const containerCanvasId = 'container-canvas';

const tickrate = 1000 / 2;
const startupt = 800;

const current = {
    player: null, table: null, seat: null
};

$(document).ready(() => {
    const debug = new HTMLLogger();

    const staticCanvas = document.getElementById(canvasLayerIds[0]);
    const dynamicCanvas = document.getElementById(canvasLayerIds[1]);
    const labelCanvas = document.getElementById(canvasLayerIds[2]);

    const staticCtx = staticCanvas.getContext('2d');
    const dynamicCtx = dynamicCanvas.getContext('2d');
    const labelCtx = labelCanvas.getContext('2d');

    const canvasGroup = [staticCanvas, dynamicCanvas, labelCanvas];

    const socket = io.connect(window.location.origin, {
        'reconnection': false
    });

    resizeCanvases(containerCanvasId, canvasGroup);

    const ui = new ClientUI();

    ui.hideAllButtons();

    ui.$betrangeslider.on('change', () => {
        const slidervalue = ui.$betrangeslider.val();
        ui.$bettextfield.val(slidervalue);
    });

    {
        socket.on('connect', (data) => {
            current.table = new Table(9, staticCanvas, dynamicCanvas, labelCanvas);

            current.table.init();
            current.table.redraw();
        });

        socket.on('assigned-table', (data) => {
            current.player = new Player(data.guestname, socket.id, 0, dynamicCanvas);

            current.seat = data.table.assignedSeat;

            current.table.assignedId = data.table.id;
            current.table.centerLabelText = 'waiting for players ...';

            current.table.seatPlayer(data.table.assignedSeat, current.player);
            current.table.seatOpponents(data.table.seatingState, socket.id);

            resizeCanvases(containerCanvasId, canvasGroup);
        });

        socket.on('a-player-has-joined', (data) => {
            current.table.seatOpponents(data.table.seatingState, socket.id);

            resizeCanvases(containerCanvasId, canvasGroup);
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
                `playe id: ${socket.id}`,
                `seat index: ${current.seat}`,
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
                    ui.$btnsendblind.toggle(ui.$hidebtn);
                    ui.$btnsendblind.val('post small blind');
                    ui.$btnsendblind.on('click', () => {
                        socket.emit('post-blind', {
                            blindType: 'sb',
                            betAmount: data.blindBetSize / 2,
                            tableid: current.table.id,
                            gameid: current.table.game.id
                        });

                        ui.$btnsendblind.toggle(ui.$hidebtn);
                    });
                    break;
                case 'bb':
                    ui.$btnsendblind.toggle(ui.$hidebtn);
                    ui.$btnsendblind.val('post big blind');
                    ui.$btnsendblind.on('click', () => {
                        socket.emit('post-blind', {
                            blindType: 'bb',
                            betAmount: data.blindBetSize,
                            tableid: current.table.id,
                            gameid: current.table.game.id
                        });

                        ui.$btnsendblind.toggle(ui.$hidebtn);
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

            ui.$btnsendcall.toggle(ui.$hidebtn);
            ui.$btnsendraise.toggle(ui.$hidebtn);
            ui.$btnsendfold.toggle(ui.$hidebtn);

            ui.$btnsendcall.val(`call ${data.minBetSize}`);
            ui.$btnsendcall.on('click', () => {
                ui.$btnsendcall.toggle(ui.$hidebtn);
                ui.$btnsendraise.toggle(ui.$hidebtn);
                ui.$btnsendfold.toggle(ui.$hidebtn);

                action('call', data.minBetSize);
            });

            ui.$btnsendraise.val(`raise ${'x'}`);
            ui.$btnsendraise.on('click', () => {
                ui.$btnsendcall.toggle(ui.$hidebtn);
                ui.$btnsendraise.toggle(ui.$hidebtn);
                ui.$btnsendfold.toggle(ui.$hidebtn);

                action('raise', data.minBetSize);
            });

            ui.$btnsendfold.on('click', () => {
                ui.$btnsendcall.toggle(ui.$hidebtn);
                ui.$btnsendraise.toggle(ui.$hidebtn);
                ui.$btnsendfold.toggle(ui.$hidebtn);

                action('fold', 0);
            });

        });

        socket.on('player-dealt-cards', (data) => {
            debug.delimit('player was dealt hole cards:');
            debug.logobject(data.a);
            debug.logobject(data.b);

            resizeCanvases(containerCanvasId, canvasGroup);

            current.table.drawCards(current.seat, data.a, data.b);
        });

        socket.on('flop-dealt', (data) => {
            debug.delimit('flop dealt');
            debug.logobject(data.a);
            debug.logobject(data.b);
            debug.logobject(data.c);

            resizeCanvases(containerCanvasId, canvasGroup);

            current.table.drawCommunityCards(data.a, data.b, data.c);
        });

        socket.on('update-table-state', (data) => {
            debug.delimit('player posted bet')
            debug.logobject(data);

            current.table.centerLabelText = `pot size: ${data.potsize}`;
            current.table.seats.get(data.playerSeat).player.balance = data.updatedBalance;

            resizeCanvases(containerCanvasId, canvasGroup);

            drawChips(current.table, data.playerSeat, data.updatedBalance);
        });
    }

    let renderLoop = null;

    {
        setTimeout(() => { // start
            setTimeout(() => { // update
                renderLoop = setInterval(() => {
                    current.table.render();
                }, tickrate, current.table, staticCanvas);
            }, startupt);
        }, startupt);
    }

    debug.delimit('start up complete!', 'ready ...');

    $(window).on('resize', () => {
        resizeCanvases(containerCanvasId, canvasGroup);
        current.table.redraw();
    });
});