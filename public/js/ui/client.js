const flags = {
    DEBUG: true,
    NOCONN: true
};

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

const testdata = {
    gamedata: {
        gameid: 0,
        seatIndex: 3
    },
    cards: {
        a: { value: 5, suite: 0 },
        b: { value: 8, suite: 2 }
    }
};

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
            {
                console.log(`===`);
                console.log('established socket conn');
                console.log(`client id: ${socket.id}`);
                console.log(`running settup ...`);
                console.log(`... creating a table ...`);
                console.log(`... done.`);
                console.log(`===`);
            }

            current.table = new Table(9, staticCanvas, labelCanvas);

            current.table.init();
            current.table.redraw();
        });

        socket.on('assigned-table', (data) => {
            {
                console.log(`===`);
                console.log(`player assigned to table and got seating:`);
                console.log(`assigned name: ${data.guestname}`);
                console.log(`assigned seat: ${data.table.assignedSeat}`);
                console.log(`table id: ${data.table.id}`);
                console.log(data);
                console.log(`===`);
            }

            current.player = new Player(data.guestname, socket.id, 0, dynamicCanvas);
            current.table.assignedId = data.table.id;

            current.table.seatPlayer(data.table.assignedSeat, current.player);
            current.table.seatOpponents(data.table.seatingState, socket.id);

            current.table.centerLabelText = 'waiting for players ...';

            resizeCanvases(containerCanvasId, canvasGroup);

            // socket.emit('table-state-requested', {
            //     tableid: current.table.id
            // });
            // const subscribeGameStart = () => {
            //     current.table.game.start(current.player);
            // }
        });

        socket.on('a-player-has-joined', (data) => {
            current.table.seatOpponents(data.table.seatingState, socket.id);

            resizeCanvases(containerCanvasId, canvasGroup);

            // socket.emit('table-state-requested', {
            //     tableid: current.table.id
            // });
        });

        socket.on('server-sent-table-state', (data) => {
            // if (data.table)
        });

        // socket.on('cards-dealt', oncardsdealt);
    }

    let renderLoop = null;

    {
        setTimeout(() => { // start
            console.log(`===`);
            console.log('entered start ...');
            setTimeout(() => { // update
                console.log(`===`);
                console.log('... started update ...');
                renderLoop = setInterval(() => {
                    current.table.render();
                }, tickrate, current.table, staticCanvas);
                console.log('... updating running ...');
                console.log(`===`);
            }, startupt);
            console.log('... exited start.');
            console.log(`===`);
        }, startupt);
    }

    $(window).on('resize', () => {
        resizeCanvases(containerCanvasId, canvasGroup);
        current.table.redraw();
    });
});