const resizeCanvases = (parentCanvasId, canvasEleGroup) => {
    const parentEle = document.getElementById(parentCanvasId);

    const w = parentEle.offsetWidth;
    const h = parentEle.offsetHeight;

    for (const c of canvasEleGroup) {
        c.width = w;
        c.height = h;
    }
};

const canvasLayerIds = ['static-canvas', 'dynamic-canvas', 'label-canvas'];
const containerCanvasId = 'container-canvas';

const tickrate = 1000 / 2;
const startupt = 800;

const current = {
    player: null, table: null
};

$(document).ready(() => {
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
    const $btnsendfold = $('#btn-send-fold');
    const $btnsendcall = $('#btn-send-call');
    const $btnsendraise = $('#btn-send-raise');

    const $allbtns = [
        $btnsendblind, $btnsendfold, $btnsendcall, $btnsendraise
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

            {
                console.log('===');
                console.log('player id');
                console.log(current.player.id);
                console.log('seat index');
                console.log(current.player.seatPositionIndex);
                console.log('turn position index:');
                console.log(current.player.turnPositionIndex);
                console.log('button index');
                console.log(current.table.buttonIndex);
                console.log(data);
                console.log('===');
            }
        });

        socket.on('action', (data) => {
            {
                console.log('===');
                console.log('player got an action');
                console.log(current.player);
                console.log(data);
                console.log('===');
            }

            switch (data.type) {
                case 'post-small-blind':
                    console.log(data.type);
                    $btnsendblind.toggle($hidebtn);
                    break;
                case 'post-big-blind':
                    console.log(data.type);
                    $btnsendblind.toggle($hidebtn);
                    break;
                case 'call':
                    console.log(data.type);
                    break;
                case 'raise':
                    console.log(data.type);
                    break;
                case 'bet':
                    console.log(data.type);
                    break;
                case 'check':
                    console.log(data.type);
                    break;
                default:
                    console.log('no matching action');
            }
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

    $(window).on('resize', () => {
        resizeCanvases(containerCanvasId, canvasGroup);
        current.table.redraw();
    });
});