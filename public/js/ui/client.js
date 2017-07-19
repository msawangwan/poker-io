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

const updateTransforms = (parentw, parenth, table, scaler) => {
    if (!table.transformState.changed) {
        table.updateTransform(parentw, parenth, scaler);

        for (const [i, s] of table.seats) {
            if (!s.transformState.changed) {
                const p = table.pointOnTable(i);
                s.updateTransform(p.x, p.y, table.transform.radius, table.transform.offset);
                s.transformState.changed = true;
            }
        }

        table.transformState.changed = true;
    }
};

const renderTransforms = (parentcanv, table) => {
    if (table.transformState.changed) {
        table.render(parentcanv);

        for (const [i, s] of table.seats) {
            if (s.transformState.changed) {
                s.render(parentcanv);
                s.transformState.changed = false;
                s.transformState.rendered = true;
            }
        }

        table.transformState.changed = false;
        table.transformState.rendered = true;
    }
};

const containerCanvasId = 'container-canvas';
const canvasLayerIds = [
    'static-canvas', 'dynamic-canvas', 'label-canvas'
];

$(document).ready(() => {
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

    const socket = io.connect(window.location.origin, {
        'reconnection': false
    });

    resizeCanvases(containerCanvasId, canvasGroup);

    const tableObject = new Table(0);
    const seatObjects = initTableSeating(tableObject);

    const render = (c, t, ts) => {
        updateTransforms(c.width, c.height, t, ts);
        renderTransforms(c, t);
    };

    const getTableCenter = (table) => {
        return [table.transform.global.centeredAt.x, table.transform.global.centeredAt.y];
    };

    render(staticCanvas, tableObject, tableScale);

    const assignedPlayerName = assignName();
    const uniquePlayerId = socket.id || -100;
    const defaultPlayerBalance = 500;

    const playerObject = new Player(assignedPlayerName, uniquePlayerId, defaultPlayerBalance);

    // const [cx, cy] = getCenter(labelCanvas.width, labelCanvas.height);
    const cx = labelCanvas.width / 2;
    const cy = labelCanvas.height / 2;

    const labelid = labelRenderer.add('waiting for players ...', 'serif', 24, 'black');
    labelRenderer.setTransform(labelid, cx, cy);
    labelRenderer.render(labelCtx);

    const tickrate = 1000 / 2;

    const renderLoop = setInterval(() => {
        // updateTransforms(c.width, c.height, t, ts);
        // renderTransforms(c, t);
        // labelRenderer.render(labelCtx);
    }, tickrate);

    const $containerbetting = $('#container-betting');
    const $containerturnactions = $('#container-turn-actions');
    const $bettextfield = $('#bet-amount-text-field');
    const $betrangeslider = $('#bet-range-slider');
    const $betsubmitbutton = $('#bet-submit-bet-btn');

    $betrangeslider.on('change', () => {
        const slidervalue = $betrangeslider.val();
        $bettextfield.val(slidervalue);
    });

    socket.emit('joined-table', { name: playerObject.name, balance: playerObject.balance });

    socket.on('player-assigned-seat', data => {
        // playerState.assignedSeat.index = data.seat;
        tableObject.seatPlayer();
    });

    socket.on('table-seating-state', data => {
        // tableState.seats = data.seating;
    });

    socket.on('game-start', data => {
        socket.emit('player-readyup');
    });

    socket.on('player-readyup-accepted', data => {
        socket.emit('player-ready-for-shuffle', { dealId: data.dealId });
    });

    socket.on('deck-shuffled', data => {
        socket.emit('player-waiting-for-deal');
    });

    socket.on('hand-dealt', data => {
        playerState.holeCards.a = data.playerhand[0];
        playerState.holeCards.b = data.playerhand[1];
        playerState.holeCards.strings = data.playerhand[2];
    });

    socket.on('connect_error', () => {
        clearInterval(renderLoop);
    });

    $(window).on('resize', () => {
        console.log('window resized');
        resizeCanvases(containerCanvasId, canvasGroup);
        render(staticCanvas, tableObject, tableScale);
    });
});