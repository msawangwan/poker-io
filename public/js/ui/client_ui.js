const toRadians = theta => theta * (Math.PI / 180);
const div = content => $('<div></div>').text(content);

const jointext = (...messages) => messages.map(m => `\t${m}\n`).join('');

$(document).ready(() => {
    const socket = io.connect(window.location.origin, {
        'reconnection': false
    });

    const playerState = {
        name: `player ${Math.floor(Math.random() * 100)}`,
        balance: 10000,
        assignedSeat: {
            index: -10,
            x: 0,
            y: 0
        },
        phaseIndex: -1000
    };

    const tableState = {
        pos: { x: 0, y: 0 },
        seats: undefined
    };

    const canvasState = {
        // playerseat: undefined,
        // allseats: undefined,
        table: {
            dimensions: undefined,
            center: { x: undefined, y: undefined },
            seats: undefined
        }
    };

    const canvas = document.getElementById('table-canvas');
    const ctx = canvas.getContext('2d');

    let centerlabelText = '...';

    const canvasAxis = {
        width: 0,
        height: 0
    };

    const currentCanvasCenter = {
        x: () => canvasAxis.width * 0.5,
        y: () => canvasAxis.height * 0.5
    };

    const fixedTableDimensions = {
        seatSize: 35
    };

    const updateCanvasDimensions = () => {
        const rect = canvas.parentNode.getBoundingClientRect();

        if (canvasAxis.width === canvas.width && canvasAxis.height === canvas.height) {
            return false;
        }

        canvasAxis.width = rect.width;
        canvasAxis.height = rect.height;

        canvas.width = canvasAxis.width;
        canvas.height = canvasAxis.height;

        return true;
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

        const offset = f / 2;
        const thetaUpper = 25;
        const thetaLower = 325;

        const seating = new Map([
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

        return seating;
    };

    const drawTable = table => {
        ctx.beginPath();

        ctx.arc(table.focui.left, table.origin.y, table.radius, Math.PI * 0.5, Math.PI * 0.50 + Math.PI);
        ctx.arc(table.focui.right, table.origin.y, table.radius, Math.PI * 0.50 + Math.PI, Math.PI * 0.5);

        const yoffset = table.origin.y + table.radius;

        ctx.moveTo(table.focui.right, yoffset);
        ctx.lineTo(table.focui.left, yoffset);

        ctx.stroke();

        ctx.fillStyle = 'green';
        ctx.fill();
    };

    const drawSeating = (seatCoordinates, seatStates) => {
        if (!seatStates) {
            return false;
        }

        for (const [position, coord] of seatCoordinates.entries()) {
            let seatColor = 'lightblue';

            if (position > 0) { // note: valid player seat positions are exclusive to numbers 1-9
                const seat = seatStates[position - 1];

                if (seat[1].vacant) {
                    drawEmptySeat(coord.x, coord.y, fixedTableDimensions.seatSize);
                } else {
                    const p = seat[1].player;

                    if (p.id === socket.id) {
                        seatColor = 'orange';
                    }

                    drawPlayerSeat(coord.x, coord.y, p, fixedTableDimensions.seatSize, seatColor);
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
                old.getContext('2d').clearRect(0, 0, 300, 300);
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

        centerlabelText = labeltxt;
    };

    const drawAll = (playerSeat, seatingState, centerLabel, isResizeDraw) => {
        updateCanvasDimensions();

        const tableDimensions = calcTableDimensions(canvas.height / 4, canvas.width / 8);
        const seatCoords = calcSeatCoordinates(tableDimensions.origin, tableDimensions.radius, tableDimensions.focui.length);

        drawTable(tableDimensions);

        const seatDrawResult = drawSeating(seatCoords, seatingState);

        if (!seatDrawResult) {
            return false;
        }

        // const tablecenter = {
        //     x: seatCoords.get(-1).x, y: seatCoords.get(-1).y
        // };

        canvasState.table.dimensions = tableDimensions;
        canvasState.table.center.x = seatCoords.get(-1).x;
        canvasState.table.center.y = seatCoords.get(-1).y;
        // canvasState.table.center.x = tablecenter.x;
        // canvasState.table.center.y = tablecenter.y;
        canvasState.table.seats = seatCoords;

        return true;
    };

    const render = (table, seating, cards, labels) => {

    };

    const cardbackpair = './asset/cards-hand-back-of-cards.jpg';
    const cardspritesheet = './asset/cards_52-card-deck_stylized.png';
    const cardpixelwidth = 72.15;
    const cardpixelheight = 83.25;

    const loadSpriteFromSpriteSheet = (src, col, row, destx, desty) => {
        const cachedimg = new Image(); // TODO: cache these

        cachedimg.onload = () => {
            const loadcard = (col, row) => {
                console.log(`loading card sprite ${col} ${row}`)
                ctx.drawImage(
                    cachedimg,
                    row * cardpixelwidth, // frame index * frame width
                    col * cardpixelheight, // frame row?
                    cardpixelwidth, // frame width
                    cardpixelheight, // frame height
                    destx, // dest x
                    desty, // dest y
                    cardpixelwidth, // frame width on draw (same as input usually)
                    cardpixelheight // frame height on draw (same as input usually)
                );
            };
            loadcard(col, row);
        };

        cachedimg.src = src
    };

    const enqueueProcess = task => Promise.resolve().then(task());

    socket.emit('joined-table', { name: playerState.name, balance: playerState.balance });

    socket.on('player-assigned-seat', data => {
        // canvasState.playerseat = data.seat;
        // enqueueProcess(() => drawAll(canvasState.playerseat, canvasState.allseats))
        playerState.assignedSeat.index = data.seat;
        enqueueProcess(() => {
            drawAll(playerState.assignedSeat.index, tableState.seats);
        });
    });

    socket.on('table-seating-state', data => {
        // canvasState.allseats = data.seating;
        tableState.seats = data.seating;
        enqueueProcess(() => {
            // drawAll(canvasState.playerseat, canvasState.allseats);
            // drawTableCenterLabel(canvasState.table.center.x, canvasState.table.center.y, centerlabelText);
            drawAll(playerState.assignedSeat.index, tableState.seats);
            drawTableCenterLabel(tableState.pos.x, tableState.pos.y, centerlabelText);
        });
    });

    socket.on('hand-dealt', data => {
        const cardA = data.playerhand[0];
        const cardB = data.playerhand[1];

        console.log('**'); // { suite, value }
        console.log('dealer dealt'); // { suite, value }
        console.log(data.playerhand[2].af.value + ' of ' + data.playerhand[2].af.suite);
        console.log(data.playerhand[2].bf.value + ' of ' + data.playerhand[2].bf.suite);
        console.log(data.playerhand);
        console.log('**'); // { suite, value }

        // loadSpriteFromSpriteSheet(cardspritesheet, cardA.suite, cardA.value, canvasState.table.center.x, canvasState.table.center.y);
        // loadSpriteFromSpriteSheet(cardspritesheet, cardB.suite, cardB.value, canvasState.table.center.x + cardpixelwidth, canvasState.table.center.y);
        loadSpriteFromSpriteSheet(cardspritesheet, cardA.suite, cardA.value, playerState.assignedSeat.x, playerState.assignedSeat.y);
        loadSpriteFromSpriteSheet(cardspritesheet, cardB.suite, cardB.value, playerState.assignedSeat.x + cardpixelwidth, playerState.assignedSeat.y);
    });

    socket.on('current-game-state', data => {
        const currentStateIndex = data.state;

        console.log('state: ' + currentStateIndex);

        switch (currentStateIndex) {
            case -1:
                if (playerState.phaseIndex !== -1) {
                    enqueueProcess(() => {
                        // () => drawTableCenterLabel(canvasState.table.center.x, canvasState.table.center.y, 'Waiting for players ...')
                        drawTableCenterLabel(tableState.pos.x, tableState.pos.y, 'Waiting for players ...')
                    });
                    playerState.phaseIndex = -1;
                }
                return;
            case 0:
                if (playerState.phaseIndex !== 0) {
                    socket.emit('player-ready-for-game');
                    // drawTableCenterLabel(canvasState.table.center.x, canvasState.table.center.y, `game starting ...`);
                    drawTableCenterLabel(tableState.pos.x, tableState.pos.y, `game starting ...`);
                    playerState.phaseIndex = 0;
                }
                return;
            case 1:
                if (playerState.phaseIndex !== 1) {
                    socket.emit('game-ready-for-start');
                    drawTableCenterLabel(tableState.pos.x, tableState.pos.y, `pot size: ${0}`);
                    // drawTableCenterLabel(canvasState.table.center.x, canvasState.table.center.y, `pot size: ${0}`);
                    playerState.phaseIndex = 1;
                }
                return;
            case 2:
                if (playerState.phaseIndex !== 2) {
                    drawTableCenterLabel(tableState.pos.x, tableState.pos.y, `pot size: ${0}`);
                    // drawTableCenterLabel(canvasState.table.center.x, canvasState.table.center.y, `pot size: ${0}`);
                    socket.emit('ready-for-shuffle');
                    playerState.phaseIndex = 2;
                }
                break;
            case 3:
                if (playerState.phaseIndex !== 3) {
                    socket.emit('waiting-for-hole-cards');
                    playerState.phaseIndex = 3;
                }
            case 4:
                if (playerState.phaseIndex !== 4) {
                    console.log('got hole cards');
                    playerState.phaseIndex = 4;
                }
            default:
                return;
        }
    });

    socket.on('connect_error', () => {
        // disconnected
    });


    $(window).on('resize', () => {
        console.log('window resized');
        // TODO: wrap in enqueue process???
        // drawAll(canvasState.playerseat, canvasState.allseats);
        // drawTableCenterLabel(canvasState.table.center.x, canvasState.table.center.y, centerlabelText);
        drawAll(playerState.assignedSeat.index, tableState.seats);
        drawTableCenterLabel(tableState.pos.x, tableState.pos.y, centerlabelText);
    });
});
    // const img_cardback = new Image();
    // const drawTable = seatedAt => {
    //     const tableradius = table.dimensions.radius;

    //     const originx = currentCanvasCenter.x();
    //     const originy = currentCanvasCenter.y();

    //     const scale = table.dimensions.scale;

    //     const imgw = img_cardback.width * scale;
    //     const imgh = img_cardback.height * scale;

    //     const offsetx = imgw / 2;
    //     const offsety = imgh / 2;

    //     const step = table.dimensions.spacing;

    //     for (let theta = 0; theta < 360; theta += step) {
    //         const rads = toRadians(theta);

    //         const x = (originx + tableradius * 0.25 * Math.cos(rads)) - offsetx;
    //         const y = (originy + tableradius * Math.sin(rads)) - offsety;

    //         ctx.font = '24px serif';
    //         ctx.fillText(theta, x, y);
    //     }
    // };

    // const img_cardsheet = new Image();

    // const getCardAtIndex = (s, v) => {
    //     console.log(s + ' ' + v);
    //     ctx.drawImage(
    //         img_cardsheet,
    //         v * cardpixelwidth, // frame index * frame width
    //         s * cardpixelheight, // frame row?
    //         cardpixelwidth, // frame width
    //         cardpixelheight, // frame height
    //         s * v, // dest x
    //         s, // dest y
    //         cardpixelwidth, // frame width on draw (same as input usually)
    //         cardpixelheight // frame height on draw (same as input usually)
    //     );
    // };

    // let suite = 0;
    // let v = 0;

    // img_cardsheet.onload = () => {
    //     setInterval(() => {
    //         if (suite >= 4) {
    //             suite = 0;
    //         }

    //         if (v >= 13) {
    //             v = 0;
    //         }

    //         getCardAtIndex(suite, v);
    //         suite += 1;
    //         v += 1;
    //     }, 750);
    // };

    // img_cardsheet.src = cardspritesheet;

// const cardbackpair = './asset/cards-hand-back-of-cards.jpg';
// const cardspritesheet = './asset/cards_52-card-deck_stylized.png';
// const cardpixelwidth = 72.15;
// const cardpixelheight = 83.25;