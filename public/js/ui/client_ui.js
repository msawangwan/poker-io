const toRadians = theta => theta * (Math.PI / 180);
const div = content => $('<div></div>').text(content);

const jointext = (...messages) => messages.map(m => `\t${m}\n`).join('');

const cardbackpair = './asset/cards-hand-back-of-cards.jpg';
const cardspritesheet = './asset/cards_52-card-deck_stylized.png';
const cardpixelwidth = 72.15;
const cardpixelheight = 83.25;

const loadSpriteFromSpriteSheet = (ctx, src, col, row, destx, desty) => {
    const cachedimg = new Image(); // TODO: cache these

    cachedimg.onload = () => {
        const loadcard = (ctx, col, row) => {
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
        loadcard(ctx, col, row);
    };

    cachedimg.src = src
};

$(document).ready(() => {
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
            b: undefined
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

    const canvas = document.getElementById('table-canvas');
    const ctx = canvas.getContext('2d');

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

    const updateTableDimensions = (playerseat) => {
        const tableDimensions = calcTableDimensions(canvas.height / 4, canvas.width / 8);
        const seatCoords = calcSeatCoordinates(tableDimensions.origin, tableDimensions.radius, tableDimensions.focui.length);

        canvasState.table.dimensions = tableDimensions;
        canvasState.table.center.x = seatCoords.get(-1).x;
        canvasState.table.center.y = seatCoords.get(-1).y;
        canvasState.table.seatCoordinates = seatCoords;

        tableState.pos.x = canvasState.table.center.x;
        tableState.pos.y = canvasState.table.center.y;

        const playerSeatCoords = getTablePosByIndex(playerseat);

        if (playerSeatCoords) {
            playerState.assignedSeat.x = playerSeatCoords.x;
            playerState.assignedSeat.y = playerSeatCoords.y;
        } else {
            console.log('err: no seat coords found');
        }
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

    const getTablePosByIndex = (index) => {
        const coords = canvasState.table.seatCoordinates;
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

    const drawCards = () => {
        if (!playerState.holeCards.a || !playerState.holeCards.b) {
            return false;
        }

        const cardA = playerState.holeCards.a;
        const cardB = playerState.holeCards.b;

        console.log(cardA);
        console.log(cardB);

        loadSpriteFromSpriteSheet(ctx, cardspritesheet, cardA.suite, cardA.value, playerState.assignedSeat.x, playerState.assignedSeat.y);
        loadSpriteFromSpriteSheet(ctx, cardspritesheet, cardB.suite, cardB.value, playerState.assignedSeat.x + cardpixelwidth, playerState.assignedSeat.y);

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

    const renderQueue = [];
    const renderLabelQueue = [];

    const labelq = [];

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

    const render = (table, seating, labels, cards) => {
        if (table) {
            if (canvasState.table.dimensions) {
                drawTable(canvasState.table.dimensions);
            }
        }

        if (seating) {
            if (canvasState.table.seatCoordinates && tableState.seats) {
                drawSeating(canvasState.table.seatCoordinates, tableState.seats);
            }
        }

        if (labels) {
            if (tableState.pos) {
                drawTableCenterLabel(tableState.pos.x, tableState.pos.y, canvasState.labels.tableCenter);
            }
        }

        if (cards) {
            drawCards();
        }
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

    socket.emit('joined-table', { name: playerState.name, balance: playerState.balance });

    socket.on('player-assigned-seat', data => {
        playerState.assignedSeat.index = data.seat;
        setCurrentTableCenterLabel('player seated ...');
    });

    socket.on('table-seating-state', data => {
        tableState.seats = data.seating;
        setCurrentTableCenterLabel('waiting for players ...');
        renderQueue.push(() => {
            updateCanvasDimensions();
            updateTableDimensions(playerState.assignedSeat.index);
            render(true, true, true, false);
        });
    });

    socket.on('hand-dealt', data => {
        playerState.holeCards.a = data.playerhand[0];
        playerState.holeCards.b = data.playerhand[1];

        renderQueue.push(() => {
            render(false, false, false, true);
        });
    });

    socket.on('current-game-state', data => {
        const currentStateIndex = data.state;

        console.log('state: ' + currentStateIndex);

        switch (currentStateIndex) {
            case -1:
                if (playerState.phaseIndex !== -1) {
                    setCurrentTableCenterLabel('waiting for players ...');
                    playerState.phaseIndex = -1;
                }
                break;
            case 0:
                if (playerState.phaseIndex !== 0) {
                    socket.emit('player-ready-for-game');
                    setCurrentTableCenterLabel('game starting ...');
                    playerState.phaseIndex = 0;
                }
                break;
            case 1:
                if (playerState.phaseIndex !== 1) {
                    socket.emit('game-ready-for-start');
                    setCurrentTableCenterLabel(`pot size: ${0}`);
                    playerState.phaseIndex = 1;
                }
                break;
            case 2:
                if (playerState.phaseIndex !== 2) {
                    socket.emit('ready-for-shuffle');
                    playerState.phaseIndex = 2;
                }
                break;
            case 3:
                if (playerState.phaseIndex !== 3) {
                    socket.emit('waiting-for-hole-cards');
                    playerState.phaseIndex = 3;
                }
                break;
            case 4:
                if (playerState.phaseIndex !== 4) {
                    console.log('got hole cards');
                    playerState.phaseIndex = 4;
                }
                break;
            default:
                break;
        }
    });

    socket.on('connect_error', () => {
        clearInterval(renderLoop);
    });

    $(window).on('resize', () => {
        console.log('window resized');

        updateCanvasDimensions();
        updateTableDimensions(playerState.assignedSeat.index);

        Promise.resolve().then(() => {
            renderQueue.push(() => {
                render(true, true, true, true);
            });
        });
    });
});