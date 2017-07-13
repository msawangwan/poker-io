const toRadians = theta => theta * (Math.PI / 180);
const div = content => $('<div></div>').text(content);

const jointext = (...messages) => messages.map(m => `\t${m}\n`).join('');

const validStates = [
    'new', 'waiting', 'playing'
];


$(document).ready(() => {
    const socket = io.connect(window.location.origin);

    const playerState = {
        name: `player ${Math.floor(Math.random() * 100)}`,
        balance: 10000,
        current: 'new'
    };
    
    const tableState = {
        playerseat: undefined,
        allseats: undefined,
        coordinates: {
            dimensions: undefined,
            center: undefined,
            seats: undefined
        }
        // drawn: false
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

    const fixedTableDimensions = {
        seatSize: 35
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
        const textwidth = ctx.measureText(labeltxt).width;
        
        ctx.beginPath();
        ctx.font = '24px serif';
        ctx.fillStyle = 'white';
        ctx.fillText(text, tableCenterx - textwidth, tableCentery);
    };

    const drawPotLabel = (x, y, potsize) => {
        // const text = `pot size: ${potsize || 0}`;
        // const textwidth = ctx.measureText(text).width;

        // ctx.beginPath();
        // ctx.font = '24px serif';
        // ctx.fillStyle = 'white';
        // ctx.fillText(text, x - textwidth, y);
        drawTableCenterLabel(x, y,`pot size: ${potsize || 0}`);
    };

    const drawAll = (playerSeat, seatingState) => {
        updateCanvasDimensions();

        const tableDimensions = calcTableDimensions(canvas.height / 4, canvas.width / 8);
        const seatCoords = calcSeatCoordinates(tableDimensions.origin, tableDimensions.radius, tableDimensions.focui.length);

        drawTable(tableDimensions);

        const seatDrawResult = drawSeating(seatCoords, seatingState);

        if (!seatDrawResult) {
            return false;
        }
        
        const tablecenter = {
            x:seatCoords.get(-1).x, y: seatCoords.get(-1).y
        };

        // drawPotLabel(seatCoords.get(-1).x, seatCoords.get(-1).y, 0);
        drawPotLabel(tablecenter.x, tablecenter.y, 0);

        tableState.coordinates.dimensions = tableDimensions;
        tableState.coordinates.center = tablecenter;
        tableState.coordinates.seats = seatCoords;

        return true;
    };

    socket.emit('joined-table', { name: playerState.name, balance: playerState.balance });

    socket.on('player-assigned-seat', data => {
        tableState.playerseat = data.seat;
        process.nextTick(()=> drawAll(tableState.playerseat, tableState.allseats));
        // drawAll(tableState.playerseat, tableState.allseats);
    });

    socket.on('table-seating-state', data => {
        tableState.allseats = data.seating;
        process.nextTick(()=> drawAll(tableState.playerseat, tableState.allseats));
        // drawAll(tableState.playerseat, tableState.allseats);
    });

    socket.on('current-game-state', data => {
        const currentStateIndex = data.state;

        console.log('state: ' + currentStateIndex);

        switch (currentStateIndex) {
            case -1:
                if (playerState.current !== 'waiting') {
                    playerState.current = 'waiting';
                    drawPotLabel(tableState.coordinates.center.x, tableState.coordinates.center.y, 'Waiting for players ...');
                    // socket.emit('waiting-for-players');
                }
                return;
            case 0:
                socket.emit('game-start');
                return;
            case 1:
                socket.emit('ready-for-deal');
                return;
            default:
                return;
        }
    });

    socket.on('connect_error', () => {
        // do something
    });


    $(window).on('resize', () => {
        console.log('window resized');
        drawAll(tableState.playerseat, tableState.allseats);
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

    // socket.on('update-ui-display-table', state => {
    //     updateCanvasDimensions();
    //     drawTable();
    //     for (const s of state.tableState) {
    //         if (s === 'empty seat') {
    //             // seat is empty
    //         } else {

    //         }
    //     }
    // });

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
});

// const cardbackpair = './asset/cards-hand-back-of-cards.jpg';
// const cardspritesheet = './asset/cards_52-card-deck_stylized.png';
// const cardpixelwidth = 72.15;
// const cardpixelheight = 83.25;

// function ImageCache() {
//     this.store = new Map();
// }

// ImageCache.prototype.load = function (assetpath) {
//     if (this.store.has(assetpath)) {
//         return this.store.get(assetpath);
//     }

//     const img = new Image();

//     img.onload = () => { }
//     img.src = assetpath;

//     this.store.set(assetpath, img);
// };

// // sheet = parent spritesheet
// // framedata = frame width, frame height, frame index start, frame index end
// function Sprite(sheet, framedata, onload) {
//     this.src = sheet;

//     const { w, h, s, e } = framedate;

//     this.frame = {
//         width: w, height: h, start: s, end: e
//     }
// }

// Sprite.prototype.load = function () {

// };