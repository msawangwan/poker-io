const toRadians = theta => theta * (Math.PI / 180);

const div = content => $('<div></div>').text(content);
const jqObjFromStr = idstring => $(`#${idstring}`);

const jointext = (...messages) => messages.map(m => `\t${m}\n`).join('');

const cardbackpair = './asset/cards-hand-card-back.png';
const cardspritesheet = './asset/cards_52-card-deck_stylized.png';
const cardpixelwidth = 72.15;
const cardpixelheight = 83.25;
const cardbackpixelwidth = 269;
const cardbackpixelheight = 188;

const canvasIds = [
    'static-canvas', 'dynamic-canvas', 'text-canvas'
];

$(document).ready(() => {
    const spriteCache = new SpriteCache();

    const staticCanvas = document.getElementById(canvasIds[0]);
    const dynamicCanvas = document.getElementById(canvasIds[1]);
    const txtCanvas = document.getElementById(canvasIds[2]);

    const canvasGroup = [staticCanvas, dynamicCanvas, txtCanvas];

    const staticCtx = staticCanvas.getContext('2d');
    const dynamicCtx = dynamicCanvas.getContext('2d');
    const txtCtx = txtCanvas.getContext('2d');

    const tableScale = 0.65;

    const resizeCanvas = (canvas, parentCanvasId) => {
        const c = jqObjFromStr(parentCanvasId);
        canvas.width = c.width();
        canvas.height = c.height();
    };

    const resizeAllCanvas = (parentCanvasId) => {
        for (const c in canvasGroup) {
            resizeCanvas(c, parentCanvasId); // TODO: fix this creating a new jqobject each iter
        }
    };

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

    const renderTable = (cnv, t, scale) => {
        t.calcDimensions(cnv.width, cnv.height, scale);
        t.render(cnv);
    };

    const renderSeats = (cnv, t) => {
        for (const [pos, s] of t.seats) {
            const point = t.pointOnTable(pos);
            s.render(cnv, point.x, point.y, t.transform.radius, t.transform.offset);
        }
    };

    const socket = io.connect(window.location.origin, {
        'reconnection': false
    });

    resizeCanvas(staticCanvas, 'container-canvas');

    const tableObject = new Table(staticCtx);

    tableObject.calcDimensions(staticCanvas.width, staticCanvas.height, tableScale);
    tableObject.render(staticCanvas);

    renderTable(staticCanvas, tableObject, tableScale);

    const seatObjects = initTableSeating(tableObject);

    renderSeats(staticCanvas, tableObject);

    const assignedPlayerName = assignName();
    const uniquePlayerId = socket.id || -100;
    const defaultPlayerBalance = 500;

    const playerObject = new Player(assignedPlayerName, uniquePlayerId, defaultPlayerBalance);

    const drawPlayerHand = () => {
        if (!playerState.holeCards.a || !playerState.holeCards.b) {
            return false;
        }

        const cardA = playerState.holeCards.a;
        const cardB = playerState.holeCards.b;

        const cardAsuite = playerState.holeCards.strings.af.suite;
        const cardAvalue = playerState.holeCards.strings.af.value;
        const cardBsuite = playerState.holeCards.strings.bf.suite;
        const cardBvalue = playerState.holeCards.strings.bf.value;

        const c1Key = spriteCache.makeKey(cardAsuite, cardAvalue);
        const c2Key = spriteCache.makeKey(cardBsuite, cardBvalue);

        const scalefactor = 0.75;

        const cardSprite1 = spriteCache.load(cardspritesheet, c1Key, {
            row: cardA.value,
            col: cardA.suite,
            width: cardpixelwidth,
            height: cardpixelheight
        });

        const cardSprite2 = spriteCache.load(cardspritesheet, c2Key, {
            row: cardB.value,
            col: cardB.suite,
            width: cardpixelwidth,
            height: cardpixelheight
        });


        spriteCache.draw(cardSprite1, ctx, playerState.assignedSeat.x, playerState.assignedSeat.y, scalefactor, scalefactor);
        spriteCache.draw(cardSprite2, ctx, (playerState.assignedSeat.x + (cardSprite2.width * scalefactor)), playerState.assignedSeat.y, scalefactor, scalefactor);

        return true;
    };

    const drawAllOpponentActiveHand = (seatCoordinates, seatStates) => {
        if (!seatStates) {
            return false;
        }

        for (const [position, coord] of seatCoordinates.entries()) {
            if (position > 0) { // note: valid player seat positions are exclusive to numbers 1-9
                const seat = seatStates[position - 1];

                if (!seat[1].vacant) {
                    const p = seat[1].player;

                    if (p.id === socket.id) {
                        continue;
                    }

                    const key = spriteCache.makeKey(`cardback::${position}`)

                    const handBackside = spriteCache.load(cardbackpair, key, {
                        row: 0,
                        col: 0,
                        width: cardbackpixelwidth,
                        height: cardbackpixelheight
                    });

                    spriteCache.draw(handBackside, ctx, coord.x, coord.y, 0.25, 0.25);
                }
            }
        }

        return true;
    };

    const drawSeatLabel = (x, y, labeltxt) => {
        ctx.beginPath();
        ctx.font = '12px serif';
        ctx.fillStyle = 'white';
        ctx.fillText(labeltxt, x - ctx.measureText(labeltxt).width / 2, y);
    };

    const drawTableCenterLabel = (x, y, labeltxt) => {
        const $centerLabel = $('#table-center-label');

        if ($centerLabel) {
            const old = document.getElementById('table-center-label');
            if (old) {
                old.getContext('2d').clearRect(0, 0, old.width, old.height);
            }
            $centerLabel.remove();
        }

        const labelCanvas = document.createElement('canvas');
        const labelctx = labelCanvas.getContext('2d');

        labelCanvas.setAttribute('id', 'table-center-label')
        labelCanvas.width = 300;
        labelCanvas.height = 300;

        const textDimensions = ctx.measureText(labeltxt);

        labelctx.font = '24px serif';
        labelctx.fillStyle = 'white';
        labelctx.fillText(labeltxt, labelCanvas.width / 2 - textDimensions.width, labelCanvas.height / 2);

        ctx.drawImage(labelCanvas, x - labelCanvas.width / 2, y - labelCanvas.height / 2);
    };

    const setCurrentTableCenterLabel = (latestText) => {
        console.log('setting current label as: ' + latestText);
        while (labelq.length > 0) {
            const discarded = labelq.shift();
            console.log('discarded labels: ' + discarded);
        }

        canvasState.labels.tableCenter = latestText;
        console.log('current label: ' + canvasState.labels.tableCenter);

        labelq.push(latestText);
    };

    const tickrate = 1000 / 2;

    const renderLoop = setInterval(() => {

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

    socket.emit('joined-table', { name: playerObject.name, balance: playerObject.state.balance });

    socket.on('player-assigned-seat', data => {
        // playerState.assignedSeat.index = data.seat;
        // setCurrentTableCenterLabel('player seated ...');
        tableObject.seatPlayer();
    });

    socket.on('table-seating-state', data => {
        // tableState.seats = data.seating;
        // setCurrentTableCenterLabel('waiting for players ...');
        // renderQueue.push(() => {
        //     updateCanvasDimensions();
        //     updateTableDimensions(playerState.assignedSeat.index);
        //     render(true, true, true, true);
        // });
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

        renderQueue.push(() => {
            render(false, false, false, true);
        });
    });

    socket.on('connect_error', () => {
        clearInterval(renderLoop);
    });

    $(window).on('resize', () => {
        console.log('window resized');

        resizeCanvas(staticCanvas, 'container-canvas');

        // renderTable(staticCanvas, tableObject, tableScale);

        tableObject.calcDimensions(staticCanvas.width, staticCanvas.height, tableScale);
        tableObject.render(staticCanvas);
        renderSeats(staticCanvas, tableObject);
    });
});