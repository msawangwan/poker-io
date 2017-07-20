const toRadians = theta => theta * (Math.PI / 180);

const div = content => $('<div></div>').text(content);
const jqObjFromStr = idstring => $(`#${idstring}`);

const jointext = (...messages) => messages.map(m => `\t${m}\n`).join('');

const initTableSeating = (t) => {
    const newSeats = [
        new Seat(0, 32, 'black'),
        new Seat(1, 32, 'black'),
        new Seat(2, 32, 'black'),
        new Seat(3, 32, 'black'),
        new Seat(4, 32, 'black'),
        new Seat(5, 32, 'black'),
        new Seat(6, 32, 'black'),
        new Seat(7, 32, 'black'),
        new Seat(8, 32, 'black'),
    ];

    for (const s of newSeats) {
        t.addSeat(s);
    }

    return newSeats;
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

// const setLabelTableCenter = (renderer, id, ctx, cx, cy, txt) => {
//     if (renderer.labels.has(id)) {
//         renderer.remove(ctx, id);
//     }

//     const newId = renderer.add(txt, 'serif', 18, 'black');
//     renderer.labels.get(newId).label.updateTransform(ctx, cx, cy);

//     return newId;
// };

// const setLabelTableSeat = (renderer, id, ctx, cx, cy, txt) => {
//     if (renderer.labels.has(id)) {
//         renderer.remove(ctx, id);
//     }

//     const newId = renderer.add(txt, 'serif', 18, 'white');
//     renderer.labels.get(newId).label.updateTransform(ctx, cx, cy);

//     return newId;
// };

const containerCanvasId = 'container-canvas';
const canvasLayerIds = [
    'static-canvas', 'dynamic-canvas', 'label-canvas'
];

$(document).ready(() => {
    const socket = io.connect(window.location.origin, {
        'reconnection': false
    });

    const spriteCache = new SpriteCache();
    const labelRenderer = new LabelRenderer();

    const staticCanvas = document.getElementById(canvasLayerIds[0]);
    const dynamicCanvas = document.getElementById(canvasLayerIds[1]);
    const labelCanvas = document.getElementById(canvasLayerIds[2]);

    const canvasGroup = [staticCanvas, dynamicCanvas, labelCanvas];

    const staticCtx = staticCanvas.getContext('2d');
    const dynamicCtx = dynamicCanvas.getContext('2d');
    const labelCtx = labelCanvas.getContext('2d');

    const tableScale = 0.65;

    resizeCanvases(containerCanvasId, canvasGroup);

    const table = new Table(0);
    const seats = initTableSeating(table);

    const assignedPlayerName = assignName();
    const uniquePlayerId = socket ? socket.id : -100;
    const defaultPlayerBalance = 500;

    const player = new Player(assignedPlayerName, uniquePlayerId, defaultPlayerBalance);

    // const setLabelTableCenter = (renderer, id, ctx, cx, cy, txt) => {
    //     if (renderer.labels.has(id)) {
    //         renderer.remove(ctx, id);
    //     }
    //     const newId = renderer.add(txt, 'serif', 18, 'black');
    //     renderer.labels.get(newId).label.updateTransform(ctx, cx, cy);

    //     return newId;
    // };

    // let lableTableCenterId = setLabelTableCenter(labelRenderer, -10, labelCtx, labelCanvas.width / 2, labelCanvas.height / 2, 'waiting for players');
    let labelIdTableCenter = labelRenderer.add('...', 'serif', 18, 'white');
    labelRenderer.update(labelIdTableCenter, labelCtx, labelCanvas.width / 2, labelCanvas.height / 2, 'waiting for players ...');

    const tickrate = 1000 / 2;

    const renderLoop = setInterval(() => {
        if (table.canvasChanged) {
            table.updateTransform(staticCanvas, tableScale);
        }

        for (const [i, s] of table.seats) {
            if (s.canvasChanged) {
                const p = table.pointOnTable(staticCanvas, i);
                s.updateTransform(p.x, p.y, table.transform.radius, table.transform.offset);
            }
        }

        if (table.drawOnNextTick) {
            table.render(staticCanvas);
        }

        for (const [i, s] of table.seats) {
            if (s.drawOnNextTick) {
                s.render(staticCanvas);
            }
        }

        labelRenderer.render(labelCtx);
    }, tickrate, table, staticCanvas);


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
        player.gameid = data.gameId;

        console.log(data.seatIndex);

        const result = table.playerSeatedAt(data.seatIndex, player);

        if (result) {
            player.sitAt(table, data.seatIndex);

            let playerLabel = -1000;
            let balanceLabel = -10001;
            setTimeout(() => {
                // playerLabel = setLabelTableSeat(labelRenderer, playerLabel, labelCtx, player.seat.x, player.seat.y, player.name);
                // balanceLabel = setLabelTableSeat(labelRenderer, balanceLabel, labelCtx, player.seat.x, player.seat.y, player.balance);
            }, 2000);
        }

        socket.emit('player-ready', { seated: result });
    });

    $(window).on('resize', () => {
        resizeCanvases(containerCanvasId, canvasGroup);

        table.canvasChanged = true;

        for (const [i, s] of table.seats) {
            s.canvasChanged = true;
        }
        labelRenderer.update(labelIdTableCenter, labelCtx, labelCanvas.width / 2, labelCanvas.height / 2, 'waiting for players ...');
        // lableTableCenterId = setLabelTableCenter(labelRenderer, lableTableCenterId, labelCtx, labelCanvas.width / 2, labelCanvas.height / 2, 'waiting for players');
    });
});