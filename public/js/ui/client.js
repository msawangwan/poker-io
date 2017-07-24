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

    {
        const $containerbetting = $('#container-betting');
        const $containerturnactions = $('#container-turn-actions');
        const $bettextfield = $('#bet-amount-text-field');
        const $betrangeslider = $('#bet-range-slider');
        const $betsubmitbutton = $('#bet-submit-bet-btn');

        $betrangeslider.on('change', () => {
            const slidervalue = $betrangeslider.val();
            $bettextfield.val(slidervalue);
        });
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

        // socket.on('post-blinds', (data) => {
        //     let blindtype = data.type;

        //     socket.emit('player-posted-blind', { type: blindtype, tableid: current.table.id });
        // });

        socket.on('action', (data) => {
            console.log('GOT AN ACTION');
            console.log(data);
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