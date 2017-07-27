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

    const $betrangeslider = $('#bet-range-slider');
    const $bettextfield = $('#bet-amount-text-field');

    $betrangeslider.on('change', () => {
        const slidervalue = $betrangeslider.val();
        $bettextfield.val(slidervalue);
    });

    const $btnsendbet = $('#btn-send-bet');
    const $btnsendblind = $('#btn-send-blind');
    const $btnsendcheck = $('#btn-send-check');
    const $btnsendfold = $('#btn-send-fold');
    const $btnsendcall = $('#btn-send-call');
    const $btnsendraise = $('#btn-send-raise');

    const $allbtns = [
        $btnsendbet, $btnsendblind, $btnsendcheck, $btnsendfold, $btnsendcall, $btnsendraise
    ];

    const $hidebtn = '#hide-button';

    for (const $b of $allbtns) {
        $b.toggle($hidebtn);
    }


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
                `button index: ${current.table.buttonIndex}`,
                `small blind index: ${current.table.sbIndex}`,
                `big blind index: ${current.table.bbIndex}`
            );
        });

        socket.on('action-to-player', (data) => {
            {
                debug.delimit(
                    `${current.player.name} it's your turn!`,
                );
                debug.logobject(data);
            }

            const submitAction = (t, b, p) => {
                socket.emit('player-submit-action', {
                    betType: t,
                    betAmount: b,
                    turnPhase: p,
                    tableid: current.table.id,
                    gameid: current.table.game.id
                });
            };

            switch (data.gamePhase) {
                case 'predeal':
                    if (data.allowedactions.includes('smallblind')) {
                        $btnsendblind.toggle($hidebtn);
                        $btnsendblind.val('post small blind');
                        $btnsendblind.on('click', () => {
                            submitAction('ante', data.minbet / 2, 'predeal');
                            $btnsendblind.toggle($hidebtn);
                        });
                    }

                    if (data.allowedactions.includes('bigblind')) {
                        $btnsendblind.toggle($hidebtn);
                        $btnsendblind.val('post big blind');
                        $btnsendblind.on('click', () => {
                            submitAction('ante', data.minbet, 'predeal');
                            $btnsendblind.toggle($hidebtn);
                        });
                    }
                    break;
                case 'preflop':
                    if (data.allowedactions.includes('bet')) {
                        $btnsendbet.toggle($hidebtn);
                        $btnsendbet.val(`bet ${data.minbet}`);
                        $btnsendbet.on('click', () => {
                            submitAction('bet', data.minbet, 'preflop');

                            $btnsendbet.toggle($hidebtn);
                        });


                        $btnsendcheck.toggle($hidebtn);
                        $btnsendcheck.val(`check`);
                        $btnsendcheck.on('click', () => {
                            submitAction('check', data.minbet, 'preflop');

                            $btnsendcheck.toggle($hidebtn);
                        });

                        $btnsendfold.toggle($hidebtn);
                        $btnsendfold.on('click', () => {
                            submitAction('fold', 0);

                            $btnsendbet.toggle($hidebtn);
                            $btnsendcheck.toggle($hidebtn);
                            $btnsendfold.toggle($hidebtn);
                        });
                    }

                    break;
                case 'postflop':
                    break;
                case 'preriver':
                    break;
                case 'postriver':
                    break;
                default:
                    break;
            }
        });


        socket.on('player-dealt-cards', (data) => {
            console.log(data);

            debug.delimit('player was dealt hole cards:');
            debug.logobject(data.a);
            debug.logobject(data.b);

            resizeCanvases(containerCanvasId, canvasGroup);

            current.table.drawCards(current.seat, data.a, data.b);
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