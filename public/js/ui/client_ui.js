const toRadians = theta => theta * (Math.PI / 180);
const div = content => $('<div></div>').text(content);

const jointext = (...messages) => messages.map(m => `\t${m}\n`).join('');

const cardbackpair = './asset/cards-hand-card-back.png';
const cardspritesheet = './asset/cards_52-card-deck_stylized.png';
const cardpixelwidth = 72.15;
const cardpixelheight = 83.25;
const cardbackpixelwidth = 269;
const cardbackpixelheight = 188;

$(document).ready(() => {
    const spriteCache = new SpriteCache();

    const canvas = document.getElementById('static-canvas'); // DEPRECATED
    const ctx = canvas.getContext('2d');

    const staticCanvas = document.getElementById('static-canvas');
    const dynamicCanvas = document.getElementById('dynamic-canvas');
    const uiCanvas = document.getElementById('ui-canvas');

    const staticCtx = staticCanvas.getContext('2d');
    const dynamicCtx = dynamicCanvas.getContext('2d');
    const uiCtx = uiCanvas.getContext('2d');

    const tableScale = 0.65;

    const resizeCanvas = (c) => { // TODO: figure this out properly
        const rect = c.parentNode.getBoundingClientRect();
        // c.width = rect.width;
        // c.height = rect.height;
        c.width = window.innerWidth;
        c.height = window.innerHeight;
    };

    resizeCanvas(staticCanvas);

    const tableObject = new Table(staticCtx);
    const seatObjects = [
        new Seat(staticCtx, 0, 32, 'black'),
        new Seat(staticCtx, 1, 32, 'black'),
        new Seat(staticCtx, 2, 32, 'black'),
        new Seat(staticCtx, 3, 32, 'black'),
        new Seat(staticCtx, 4, 32, 'black'),
        new Seat(staticCtx, 5, 32, 'black'),
        new Seat(staticCtx, 6, 32, 'black'),
        new Seat(staticCtx, 7, 32, 'black'),
        new Seat(staticCtx, 8, 32, 'black'),
    ];

    tableObject.render(staticCanvas.width, staticCanvas.height, tableScale);

    for (const s of seatObjects) {
        const c = tableObject.pointOnTable(s.position);
        s.render(c.x, c.y);
    }

    const socket = io.connect(window.location.origin, {
        'reconnection': false
    });

    const playerState = {
        name: `player ${Math.floor(Math.random() * 100)}`,
        balance: 10000,
        assignedSeat: {
            index: undefined,
            x: 0,
            y: 0
        },
        holeCards: {
            a: undefined,
            b: undefined,
            strings: undefined
        },
        phaseIndex: undefined
    };

    const tableState = {
        pos: { x: 0, y: 0 },
        seats: undefined
    };

    const canvasState = {
        table: {
            dimensions: undefined,
            center: { x: undefined, y: undefined },
            seatCoordinates: undefined
        },
        labels: {
            tableCenter: ' ... '
        }
    };

    const maincanvas = {
        width: 0,
        height: 0
    };

    const currentCanvasCenter = {
        x: () => maincanvas.width * 0.5,
        y: () => maincanvas.height * 0.5
    };

    const seating = {
        coordinates: undefined,
        playercoordinates: undefined
    };

    const updateCanvasDimensions = () => {
        // const rect = canvas.parentNode.getBoundingClientRect();

        // if (maincanvas.width === canvas.width && maincanvas.height === canvas.height) {
        //     return false;
        // }

        // maincanvas.width = rect.width;
        // maincanvas.height = rect.height;

        // canvas.width = maincanvas.width;
        // canvas.height = maincanvas.height;

        // return true;
    };

    const updateTableDimensions = (playerseat) => {
        // const tableDimensions = calcTableDimensions(canvas.height / 4, canvas.width / 8);
        // const seatCoords = calcSeatCoordinates(tableDimensions.origin, tableDimensions.radius, tableDimensions.focui.length);

        // canvasState.table.dimensions = tableDimensions;
        // canvasState.table.center.x = seatCoords.get(-1).x;
        // canvasState.table.center.y = seatCoords.get(-1).y;
        // canvasState.table.seatCoordinates = seatCoords; // TODO: DEPRECATED

        // seating.coordinates = seatCoords;

        // tableState.pos.x = canvasState.table.center.x;
        // tableState.pos.y = canvasState.table.center.y;

        // const playerSeatCoords = getTablePosByIndex(playerseat, seating.coordinates);

        // if (playerSeatCoords) {
        //     playerState.assignedSeat.x = playerSeatCoords.x; // TODO: DEPRECATED
        //     playerState.assignedSeat.y = playerSeatCoords.y; // TODO: DEPRECATED
        //     seating.playercoordinates = playerSeatCoords;
        // } else {
        //     console.log('err: no seat coords found');
        // }
    };

    const calcTableDimensions = (radius, focuilength) => {
        const originx = currentCanvasCenter.x();
        const originy = currentCanvasCenter.y();

        return {
            origin: {
                x: originx,
                y: originy
            },
            radius: radius,
            focui: {
                length: focuilength,
                left: originx - focuilength,
                right: originx + focuilength
            }
        }
    };

    const calcSeatCoordinates = (o, radius, f) => {
        const { x: ox, y: oy } = o;

        const offsetOriginLeft = ox - f;
        const offsetOriginRight = ox + f;

        // const offset = f / 2;
        const thetaUpper = 25;
        const thetaLower = 325;

        const pointsOnTableCircumference = new Map([
            [-1, {
                label: 'pot-table-center',
                x: ox,
                y: oy
            }],
            [0, {
                label: 'house-center-upper',
                x: ox,
                y: oy - radius
            }],
            [1, {
                label: 'right-upper',
                x: offsetOriginRight,
                y: oy - radius
            }],
            [2, {
                label: 'right-theta-upper',
                x: offsetOriginRight + radius * Math.cos(toRadians(thetaUpper)),
                y: oy - radius * Math.sin(toRadians(thetaUpper))
            }],
            [3, {
                label: 'right-theta-lower',
                x: offsetOriginRight + radius * Math.cos(toRadians(thetaLower)),
                y: oy - radius * Math.sin(toRadians(thetaLower))
            }],
            [4, {
                label: 'right-lower',
                x: offsetOriginRight,
                y: oy + radius
            }],
            [5, {
                label: 'center-lower',
                x: ox,
                y: oy + radius
            }],
            [6, {
                label: 'left-lower',
                x: offsetOriginLeft,
                y: oy + radius
            }],
            [7, {
                label: 'left-theta-lower',
                x: offsetOriginLeft - radius * Math.cos(toRadians(thetaLower)),
                y: oy - radius * Math.sin(toRadians(thetaLower))
            }],
            [8, {
                label: 'left-theta-upper',
                x: offsetOriginLeft - radius * Math.cos(toRadians(thetaUpper)),
                y: oy - radius * Math.sin(toRadians(thetaUpper))
            }],
            [9, {
                label: 'left-upper',
                x: offsetOriginLeft,
                y: oy - radius
            }],
        ]);

        return pointsOnTableCircumference;
    };

    const getTablePosByIndex = (index, coords) => {
        if (coords) { // TODO: handle undefined
            const pos = coords.get(index + 1);
            if (pos) {
                return {
                    x: pos.x,
                    y: pos.y
                }
            }
        }
    };

    const drawTable = (dimensions) => {
        ctx.beginPath();

        ctx.arc(dimensions.focui.left, dimensions.origin.y, dimensions.radius, Math.PI * 0.5, Math.PI * 0.50 + Math.PI);
        ctx.arc(dimensions.focui.right, dimensions.origin.y, dimensions.radius, Math.PI * 0.50 + Math.PI, Math.PI * 0.5);

        const yoffset = dimensions.origin.y + dimensions.radius;

        ctx.moveTo(dimensions.focui.right, yoffset);
        ctx.lineTo(dimensions.focui.left, yoffset);

        ctx.stroke();

        ctx.fillStyle = 'green';
        ctx.fill();
    };

    const drawSeating = (seatCoordinates, seatStates, seatSize) => {
        if (!seatStates) {
            return false;
        }

        for (const [position, coord] of seatCoordinates.entries()) {
            let seatColor = 'lightblue';

            if (position > 0) { // note: valid player seat positions are exclusive to numbers 1-9
                const seat = seatStates[position - 1];

                if (seat[1].vacant) {
                    drawEmptySeat(coord.x, coord.y, seatSize);
                } else {
                    const p = seat[1].player;

                    if (p.id === socket.id) {
                        seatColor = 'orange';
                    }

                    drawPlayerSeat(coord.x, coord.y, p, seatSize, seatColor);
                }
            }
        }

        return true;
    };

    const drawSeat = (x, y, seatSize, seatColor) => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, seatSize, Math.PI * 2, false);
        ctx.stroke();
        ctx.fillStyle = seatColor;
        ctx.fill();
    };

    const drawEmptySeat = (x, y, seatSize) => {
        drawSeat(x, y, seatSize, 'black');
        drawSeatLabel(x, y, 'empty');
    };

    const drawPlayerSeat = (x, y, player, seatSize, seatColor) => {
        drawSeat(x, y, seatSize, seatColor);
        drawSeatLabel(x, y, player.name);
    };

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

    const renderQueue = [];
    const renderLabelQueue = [];

    const labelq = [];

    const render = (table, seat, labels, cards) => {
        // if (table) {
        //     if (canvasState.table.dimensions) {
        //         drawTable(canvasState.table.dimensions);
        //     }
        // }

        // if (seat) {
        //     if (canvasState.table.seatCoordinates && tableState.seats) {
        //         drawSeating(canvasState.table.seatCoordinates, tableState.seats, 35);
        //     }
        // }

        // if (labels) {
        //     if (tableState.pos) {
        //         drawTableCenterLabel(tableState.pos.x, tableState.pos.y, canvasState.labels.tableCenter);
        //     }
        // }

        // if (cards) {
        //     drawPlayerHand();
        //     drawAllOpponentActiveHand(canvasState.table.seatCoordinates, tableState.seats);
        // }
    };

    const tickrate = 1000 / 2;

    const renderLoop = setInterval(() => {
        if (renderQueue.length > 0) {
            while (renderQueue.length > 0) {
                const cur = renderQueue.shift();
                cur();
            }
        }

        if (labelq.length > 0) {
            canvasState.labels.tableCenter = labelq.pop();
            render(false, false, true, false);
        }
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

    socket.emit('joined-table', { name: playerState.name, balance: playerState.balance });

    socket.on('player-assigned-seat', data => {
        playerState.assignedSeat.index = data.seat;
        setCurrentTableCenterLabel('player seated ...');
        tableObject.seatPlayer();
    });

    socket.on('table-seating-state', data => {
        tableState.seats = data.seating;
        setCurrentTableCenterLabel('waiting for players ...');
        renderQueue.push(() => {
            updateCanvasDimensions();
            updateTableDimensions(playerState.assignedSeat.index);
            render(true, true, true, true);
        });
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

        // const rect = canvas.parentNode.getBoundingClientRect();

        // canvas.width = rect.width;
        // canvas.height = rect.height;

        resizeCanvas(staticCanvas);
        tableObject.render(staticCanvas.width, staticCanvas.height, tableScale);


        for (const s of seatObjects) {
            const c = tableObject.pointOnTable(s.position);
            s.render(c.x, c.y);
        }
        // updateCanvasDimensions();
        // updateTableDimensions(playerState.assignedSeat.index);

        // Promise.resolve().then(() => {
        //     renderQueue.push(() => {
        //         render(true, true, true, true);
        //     });
        // });
    });
});