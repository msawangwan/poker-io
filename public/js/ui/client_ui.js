const toRadians = theta => theta * (Math.PI / 180);
const div = content => $('<div></div>').text(content);

const jointext = (...messages) => messages.map(m => `\t${m}\n`).join('');

const cardbackpair = './asset/cards-hand-card-back.png';
const cardspritesheet = './asset/cards_52-card-deck_stylized.png';
const cardpixelwidth = 72.15;
const cardpixelheight = 83.25;

function SpriteCache() {
    this.makeKey = (s, v) => `${s}::${v}`;

    this.spriteDataStore = new Map();
    this.spriteImageStore = new Map();
};

SpriteCache.prototype.load = function (src, key, frame) {
    if (this.spriteDataStore.has(key)) {
        return this.spriteDataStore.get(key);
    }

    const cached = new Sprite(src, frame.row, frame.col, frame.width, frame.height);

    this.spriteDataStore.set(key, cached);

    return cached;
};

SpriteCache.prototype.draw = function (sprite, ctx, dx, dy, sx, sy) {
    let img = this.spriteImageStore.get(sprite.cacheKey);

    if (!img) {
        img = new Image();
        this.spriteImageStore.set(sprite.cacheKey, img);
    }

    sprite.draw(ctx, img, dx, dy, sx, sy);
};

function Sprite(src, row, col, w, h) {
    this.src = src;

    this.width = w;
    this.height = h;

    this.row = {
        offset: row * w, index: row
    };

    this.col = {
        offset: col * h, index: col
    };

    this.cacheKey = `${this.row.index}::${this.col.index}`;
};

Sprite.prototype.draw = function (ctx, img, dx, dy, sx, sy) {
    img.onload = () => {
        ctx.drawImage(
            img,
            this.row.offset,
            this.col.offset,
            this.width,
            this.height,
            dx,
            dy,
            this.width * sx,
            this.height * sy
        );
    };

    img.src = this.src;
};


const spriteCache = new SpriteCache();

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
            console.log('errrror');
            return false;
        }

        for (const [position, coord] of seatCoordinates.entries()) {
            if (position > 0) { // note: valid player seat positions are exclusive to numbers 1-9
                const seat = seatStates[position - 1];

                if (!seat[1].vacant) {
                    console.log('found an oppoennt active hand');
                    const p = seat[1].player;

                    if (p.id === socket.id) {
                        continue;
                    }

                    const handBackside = spriteCache.load(cardbackpair, 'card::backpair', {
                        row: 0,
                        col: 0,
                        width: 269,
                        height: 188
                    });

                    spriteCache.draw(handBackside, ctx, coord.x, coord.y, 0.25, 0.25);
                }
            }
        }

        return true;
    }

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
            drawPlayerHand();
            drawAllOpponentActiveHand(canvasState.table.seatCoordinates, tableState.seats);
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

        console.log('got cards');
        console.log(data.playerhand);

        renderQueue.push(() => {
            render(false, false, false, true);
        });
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