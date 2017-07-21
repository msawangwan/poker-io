// const toRadians = theta => theta * (Math.PI / 180);

const div = content => $('<div></div>').text(content);
const jqObjFromStr = idstring => $(`#${idstring}`);

const jointext = (...messages) => messages.map(m => `\t${m}\n`).join('');

// const initTableSeating = (t) => {
//     const newSeats = [
//         new Seat(0, 32, 'black'),
//         new Seat(1, 32, 'black'),
//         new Seat(2, 32, 'black'),
//         new Seat(3, 32, 'black'),
//         new Seat(4, 32, 'black'),
//         new Seat(5, 32, 'black'),
//         new Seat(6, 32, 'black'),
//         new Seat(7, 32, 'black'),
//         new Seat(8, 32, 'black'),
//     ];

//     for (const s of newSeats) {
//         t.addSeat(s);
//     }

//     return newSeats;
// };

const resizeCanvases = (parentCanvasId, canvasEleGroup) => {
    const parentEle = document.getElementById(parentCanvasId);
    const w = parentEle.offsetWidth;
    const h = parentEle.offsetHeight;

    for (const c of canvasEleGroup) {
        c.width = w;
        c.height = h;
    }
};

const containerCanvasId = 'container-canvas';

const canvasLayerIds = [
    'static-canvas', 'dynamic-canvas', 'label-canvas'
];

$(document).ready(() => {
    const socket = io.connect(window.location.origin, {
        'reconnection': false
    });

    const spriteCache = new SpriteCache();

    const staticCanvas = document.getElementById(canvasLayerIds[0]);
    const dynamicCanvas = document.getElementById(canvasLayerIds[1]);
    const labelCanvas = document.getElementById(canvasLayerIds[2]);

    const canvasGroup = [staticCanvas, dynamicCanvas, labelCanvas];

    const staticCtx = staticCanvas.getContext('2d');
    const dynamicCtx = dynamicCanvas.getContext('2d');
    const labelCtx = labelCanvas.getContext('2d');

    const tableScale = 0.65;

    resizeCanvases(containerCanvasId, canvasGroup);

    const assignedPlayerName = Player.assignGuestName();
    const uniquePlayerId = socket ? socket.id : -100;
    const defaultPlayerBalance = 500;

    const player = new Player(assignedPlayerName, uniquePlayerId, defaultPlayerBalance);

    const tickrate = 1000 / 2;

    const table = new Table(9, staticCanvas, labelCanvas);

    let seatindex = 0;

    while (seatindex < table.maxseats) {
        table.emptySeat(seatindex);
        table.seats.get(seatindex).drawOnNextUpdate = true;
        seatindex += 1;
    }

    table.drawOnNextUpdate = true;

    // for (const [si, so] of table.seats) {
    //     so.drawOnNextUpdate = true;
    // };

    const $containerbetting = $('#container-betting');
    const $containerturnactions = $('#container-turn-actions');
    const $bettextfield = $('#bet-amount-text-field');
    const $betrangeslider = $('#bet-range-slider');
    const $betsubmitbutton = $('#bet-submit-bet-btn');

    $betrangeslider.on('change', () => {
        const slidervalue = $betrangeslider.val();
        $bettextfield.val(slidervalue);
    });

    socket.emit('joined-table', { name: player.name, balance: player.balance });

    socket.on('player-seated', (data) => {
        // player.gameid = data.gameId;

        // console.log(data.seatIndex);

        // const result = table.playerSeatedAt(data.seatIndex, player);

        // if (result) {
        //     player.sitAt(table, data.seatIndex);
        // }

        // socket.emit('player-ready', { seated: result });
    });

    setTimeout(() => { // start
        console.log('debug: start');
    }, 1500);

    setTimeout(() => { // update
        console.log('debug: update');
        const renderLoop = setInterval(() => {
            table.render();
        }, tickrate, table, staticCanvas);
    }, 3000);

    $(window).on('resize', () => {
        resizeCanvases(containerCanvasId, canvasGroup);
        table.drawOnNextUpdate = true;
        for (const [si, so] of table.seats) {
            so.drawOnNextUpdate = true;
        };
    });
});