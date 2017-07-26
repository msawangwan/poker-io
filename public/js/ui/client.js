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
    player: null, table: null
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

    const $btnsendblind = $('#btn-send-blind');
    const $btnsendcheck = $('#btn-send-check');
    const $btnsendfold = $('#btn-send-fold');
    const $btnsendcall = $('#btn-send-call');
    const $btnsendraise = $('#btn-send-raise');

    const $allbtns = [
        $btnsendblind, $btnsendcheck, $btnsendfold, $btnsendcall, $btnsendraise
    ];

    const $hidebtn = '#hide-button';

    for (const $b of $allbtns) {
        $b.toggle($hidebtn);
    }


    {
        socket.on('connect', (data) => {
            current.table = new Table(9, staticCanvas, labelCanvas);

            current.table.init();
            current.table.redraw();
        });

        socket.on('assigned-table', (data) => {
            current.player = new Player(data.guestname, socket.id, 0, dynamicCanvas);

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
            current.player.turnPositionIndex = data.turnOrderIndex;
            current.table.game = new Game(data.gameId, current.table.players);
            current.table.centerLabelText = 'pot size: 0';
            current.table.buttonIndex = data.buttonIndex;
            current.table.sbIndex = (data.buttonIndex + 1 % current.table.playerCount) % current.table.playerCount;
            current.table.bbIndex = (data.buttonIndex + 2 % current.table.playerCount) % current.table.playerCount;

            debug.logobject(data);
            debug.delimit('game is starting', 'button index: ' + data.buttonIndex, 'sb index: ' + current.table.sbIndex, 'bb index: ' + current.table.bbIndex);
        });

        socket.on('action', (data) => {
            {
                debug.log('==== * ====');
                debug.log('your turn!');
                debug.log('current betting phase:');
                debug.log('phase: ' + data.betPhase);
                debug.log('==== * ====');
            }

            let action = null;

            const onactioncompleted = (t, nt, p, b) => {
                socket.emit('bet-action', {
                    betType: t,
                    nextBetType: nt,
                    betPhase: p,
                    betAmount: b,
                    tableid: current.table.id,
                    gameid: current.table.game.id
                });
            };

            switch (data.type) {
                case 'smallblind':
                    action = () => {
                        $btnsendblind.toggle($hidebtn);
                        $btnsendblind.val('post small blind');
                        $btnsendblind.on('click', () => {
                            onactioncompleted('smallblind', 'bigblind', data.betPhase, data.minbet / 2);

                            $btnsendblind.toggle($hidebtn);
                        });
                    };
                    break;
                case 'bigblind':
                    action = () => {
                        $btnsendblind.toggle($hidebtn);
                        $btnsendblind.val('post big blind');
                        $btnsendblind.on('click', () => {
                            onactioncompleted('bigblind', 'anteup', data.betPhase, data.minbet);

                            $btnsendblind.toggle($hidebtn);
                        });
                    };
                    break;
                case 'anteup':
                    action = () => {
                        $btnsendcall.toggle($hidebtn);
                        $btnsendcall.val(`call ${data.minbet}`);
                        $btnsendcall.on('click', () => {
                            onactioncompleted('anteup', 'anteup', data.betPhase, data.minbet);

                            $btnsendcall.toggle($hidebtn);
                            $btnsendraise.toggle($hidebtn);
                            $btnsendfold.toggle($hidebtn);
                        });

                        $btnsendraise.toggle($hidebtn);
                        $btnsendraise.val(`raise ${data.minbet}`);
                        $btnsendraise.on('click', () => {
                            onactioncompleted('raise', 'bet', data.betPhase, data.minbet);

                            $btnsendcall.toggle($hidebtn);
                            $btnsendraise.toggle($hidebtn);
                            $btnsendfold.toggle($hidebtn);
                        });

                        $btnsendfold.toggle($hidebtn);
                        $btnsendfold.on('click', () => {
                            onactioncompleted('fold', 'anteup', data.betPhase, 0);

                            $btnsendcall.toggle($hidebtn);
                            $btnsendraise.toggle($hidebtn);
                            $btnsendfold.toggle($hidebtn);
                        });
                    };
                    break;
                case 'check':
                    action = () => {
                        $btnsendcheck.toggle($hidebtn);
                        $btnsendcheck.val(`check`);
                        $btnsendcheck.on('click', () => {
                            onactioncompleted('check', 'check', data.betPhase, 0);

                            $btnsendcheck.toggle($hidebtn);
                            $btnsendraise.toggle($hidebtn);
                            $btnsendfold.toggle($hidebtn);
                        });

                        $btnsendraise.toggle($hidebtn);
                        $btnsendraise.val(`raise ${data.minbet}`);
                        $btnsendraise.on('click', () => {
                            onactioncompleted('raise', 'bet', data.betPhase, data.minbet);

                            $btnsendcheck.toggle($hidebtn);
                            $btnsendraise.toggle($hidebtn);
                            $btnsendfold.toggle($hidebtn);
                        });

                        $btnsendfold.toggle($hidebtn);
                        $btnsendfold.on('click', () => {
                            onactioncompleted('fold', 'check', data.betPhase, 0);

                            $btnsendcheck.toggle($hidebtn);
                            $btnsendraise.toggle($hidebtn);
                            $btnsendfold.toggle($hidebtn);
                        });
                    };
                    break;
                case 'bet':
                    action = () => {
                        $btnsendcall.toggle($hidebtn);
                        $btnsendcall.val(`call ${data.minbet}`);
                        $btnsendcall.on('click', () => {
                            onactioncompleted('call', 'bet', data.betPhase, data.minbet);

                            $btnsendcall.toggle($hidebtn);
                            $btnsendraise.toggle($hidebtn);
                            $btnsendfold.toggle($hidebtn);
                        });

                        $btnsendraise.toggle($hidebtn);
                        $btnsendraise.val(`raise ${data.minbet}`);
                        $btnsendraise.on('click', () => {
                            onactioncompleted('raise', 'raise', data.betPhase, data.minbet);

                            $btnsendcheck.toggle($hidebtn);
                            $btnsendraise.toggle($hidebtn);
                            $btnsendfold.toggle($hidebtn);
                        });

                        $btnsendfold.toggle($hidebtn);
                        $btnsendfold.on('click', () => {
                            onactioncompleted('fold', 'bet', data.betPhase, 0);

                            $btnsendcheck.toggle($hidebtn);
                            $btnsendraise.toggle($hidebtn);
                            $btnsendfold.toggle($hidebtn);
                        });
                    };
                    break;
                case 'raise':
                    action = () => {
                        $btnsendcall.toggle($hidebtn);
                        $btnsendcall.val(`call ${data.minbet}`);
                        $btnsendcall.on('click', () => {
                            onactioncompleted('call', 'bet', data.betPhase, data.minbet);

                            $btnsendcall.toggle($hidebtn);
                            $btnsendraise.toggle($hidebtn);
                            $btnsendfold.toggle($hidebtn);
                        });

                        $btnsendraise.toggle($hidebtn);
                        $btnsendraise.val(`raise ${data.minbet}`);
                        $btnsendraise.on('click', () => {
                            onactioncompleted('raise', 'raise', data.betPhase, data.minbet);

                            $btnsendcheck.toggle($hidebtn);
                            $btnsendraise.toggle($hidebtn);
                            $btnsendfold.toggle($hidebtn);
                        });

                        $btnsendfold.toggle($hidebtn);
                        $btnsendfold.on('click', () => {
                            onactioncompleted('fold', 'check', data.betPhase, 0);

                            $btnsendcheck.toggle($hidebtn);
                            $btnsendraise.toggle($hidebtn);
                            $btnsendfold.toggle($hidebtn);
                        });
                    };
                    break;
                case 'fold':
                    alert('fold??');
                default:
                    action = () => console.log('no matching action');
                    break;
            }

            action();
        });


        socket.on('player-dealt-cards', (data) => {
            console.log(data);
        });

        socket.on('player-posted-bet', (data) => {
            // debug.log('**')
            // debug.log('player posted bet')
            // debug.log('player name: ' + data.playerName);
            // debug.log('player id: ' + data.playerId);
            // debug.log('bet type: ' + data.betType);
            // debug.log('bet phase: ' + data.betPhase);
            // debug.log('bet amount: ' + data.betAmount);
            // debug.log('new balance: ' + data.updatedBalance);
            // debug.log('updated pot size:' + data.potsize);
            // debug.log('**')
            debug.delimit('player posted bet')
            debug.logobject(data);

            current.table.centerLabelText = `pot size: ${data.potsize}`;

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