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

        // socket.on('update-potsize', (data) => {
        //     current.table.centerLabelText = `pot size: ${data.potsize}`;
        //     console.log('set potsize: ' + data.potsize);
        // });

        socket.on('game-started', (data) => {
            current.table.game = new Game(data.gameId, current.table.players);
            current.table.centerLabelText = 'pot size: 0'

            socket.emit('get-turn-order', {
                tableid: current.table.id,
                gameid: current.table.game.id
            });
        });

        socket.on('turn-order-index', (data) => {
            current.player.turnPositionIndex = data.turnOrderIndex;
            current.table.buttonIndex = data.buttonIndex;
            current.table.sbIndex = (data.buttonIndex + 1 % current.table.playerCount) % current.table.playerCount;
            current.table.bbIndex = (data.buttonIndex + 2 % current.table.playerCount) % current.table.playerCount;
        });

        socket.on('action', (data) => {
            {
                console.log('===');
                console.log('player got an action');
                console.log(current.player);
                console.log(data);
                console.log('===');
            }

            let action = null;

            switch (data.type) {
                case 'post-small-blind':
                    action = () => {
                        $btnsendblind.toggle($hidebtn);
                        $btnsendblind.val('post small blind');
                        $btnsendblind.on('click', () => {
                            socket.emit('bet-action', {
                                betType: 'smallblind',
                                betAmount: data.minbet / 2,
                                tableid: current.table.id,
                                gameid: current.table.game.id
                            });

                            $btnsendblind.toggle($hidebtn);
                        });
                    };
                    break;
                case 'post-big-blind':
                    action = () => {
                        $btnsendblind.toggle($hidebtn);
                        $btnsendblind.val('post big blind');
                        $btnsendblind.on('click', () => {
                            socket.emit('bet-action', {
                                betType: 'bigblind',
                                betAmount: data.minbet,
                                tableid: current.table.id,
                                gameid: current.table.game.id
                            });

                            $btnsendblind.toggle($hidebtn);
                        });
                    };
                    break;
                case 'post-ante-up':
                    action = () => {
                        $btnsendcall.toggle($hidebtn);
                        $btnsendcall.val(`call ${data.minbet}`);
                        $btnsendcall.on('click', () => {
                            socket.emit('bet-action', {
                                betType: 'anteup',
                                betAmount: data.minbet,
                                tableid: current.table.id,
                                gameid: current.table.game.id
                            });

                            $btnsendcall.toggle($hidebtn);
                            $btnsendraise.toggle($hidebtn);
                            $btnsendfold.toggle($hidebtn);
                        });

                        $btnsendraise.toggle($hidebtn);
                        $btnsendraise.val(`raise ${data.minbet}`);
                        $btnsendraise.on('click', () => {
                            socket.emit('bet-action', {
                                betType: 'raiseante',
                                betAmount: data.minbet,
                                tableid: current.table.id,
                                gameid: current.table.game.id
                            });

                            $btnsendcall.toggle($hidebtn);
                            $btnsendraise.toggle($hidebtn);
                            $btnsendfold.toggle($hidebtn);
                        });

                        $btnsendfold.toggle($hidebtn);
                        $btnsendfold.on('click', () => {
                            socket.emit('bet-action', {
                                betType: 'foldante',
                                betAmount: 0,
                                tableid: current.table.id,
                                gameid: current.table.game.id
                            });

                            $btnsendcall.toggle($hidebtn);
                            $btnsendraise.toggle($hidebtn);
                            $btnsendfold.toggle($hidebtn);
                        });
                    };
                case 'call':
                    break;
                case 'raise':
                    break;
                case 'bet':
                    break;
                case 'check':
                    break;
                default:
                    action = () => console.log('no matching action');
                    break;
            }

            action();
        });


        socket.on('player-dealt-cards', (data) => {
            console.log(data);
        });

        // socket.on('player-posted-blinds', (data) => {
        //     console.log('player posted blinds');
        //     console.log(data);

        //     resizeCanvases(containerCanvasId, canvasGroup);
        //     drawChips(current.table, data.playerSeat, data.updatedBalance);
        // });

        socket.on('player-posted-bet', (data) => {
            debug.log('**')
            debug.log('player posted bet')
            debug.log('player name: ' + current.player.name);
            debug.log('player id: ' + current.player.id);
            debug.log('bet type: ' + data.betType);
            debug.log('bet amount: ' + data.betAmount);
            debug.log('new balance: ' + data.updatedBalance);
            debug.log('updated pot size:' + data.potsize);
            debug.log('**')

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

    debug.log('ready ...');

    $(window).on('resize', () => {
        resizeCanvases(containerCanvasId, canvasGroup);
        current.table.redraw();
    });
});