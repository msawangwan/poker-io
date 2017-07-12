const toRadians = theta => theta * (Math.PI / 180);
const div = content => $('<div></div>').text(content);

const cardbackpair = './asset/cards-hand-back-of-cards.jpg';
const cardspritesheet = './asset/cards_52-card-deck_stylized.png';
const cardpixelwidth = 72.15;
const cardpixelheight = 83.25;

function ImageCache() {
    this.store = new Map();
}

ImageCache.prototype.load = function (assetpath) {
    if (this.store.has(assetpath)) {
        return this.store.get(assetpath);
    }

    const img = new Image();

    img.onload = () => { }
    img.src = assetpath;

    this.store.set(assetpath, img);
};

// sheet = parent spritesheet
// framedata = frame width, frame height, frame index start, frame index end
function Sprite(sheet, framedata, onload) {
    this.src = sheet;

    const { w, h, s, e } = framedate;

    this.frame = {
        width: w, height: h, start: s, end: e
    }
}

Sprite.prototype.load = function () {

};

$(document).ready(() => {
    const socket = io.connect(window.location.origin);

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

    // const testdata = {
    //     seat: 4,
    //     seatingstate: ['empty', 'joe', 'barney', 'me', 'empty', 'empty', 'hump', 'empty', 'empty']
    // };

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

    const drawSeats = (seatingCoordinates, playerSeat, seatingState) => {
        const size = 35;

        if (!seatingState || seatingState === 'undefined') {
            seatingState = ['empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty'];
        }

        for (const [position, coord] of seatingCoordinates.entries()) {
            if (position < 1) {
                continue;
            }

            ctx.beginPath();
            ctx.moveTo(coord.x, coord.y);
            ctx.arc(coord.x, coord.y, size, Math.PI * 2, false);
            ctx.stroke();

            let label = seatingState[position - 1] || 'empty';
            let color = 'lightblue'

            if (label === 'empty') {
                color = 'black';
            }

            if (playerSeat === position) {
                color = 'red';
            }

            ctx.fillStyle = color;
            ctx.fill();

            const labelsize = ctx.measureText(label);

            ctx.beginPath();
            ctx.font = '12px serif';
            ctx.fillStyle = 'white';
            ctx.fillText(label, coord.x - labelsize.width / 2, coord.y);
        }

        // const text = ctx.measureText('pot size: 0');

        // ctx.beginPath();
        // ctx.font = '24px serif';
        // ctx.fillStyle = 'white';
        // ctx.fillText('pot size: 0', seatingCoordinates.get(-1).x - text.width, seatingCoordinates.get(-1).y);
    };

    const drawPotSize = (tableCenterx, tableCentery, potsize) => {
        const text = `pot size: ${potsize || 0}`;
        const textwidth = ctx.measureText(text).width;

        ctx.beginPath();
        ctx.font = '24px serif';
        ctx.fillStyle = 'white';
        ctx.fillText(text, tableCenterx - textwidth, tableCentery);
    }

    const drawAll = (playerSeat, seatingState) => {
        updateCanvasDimensions();

        const tableDimensions = calcTableDimensions(canvas.height / 4, canvas.width / 8);
        const seatCoords = calcSeatCoordinates(tableDimensions.origin, tableDimensions.radius, tableDimensions.focui.length);

        drawTable(tableDimensions);
        drawSeats(seatCoords, playerSeat, seatingState);
        drawPotSize(seatCoords.get(-1).x, seatCoords.get(-1).y, 0);
    };

    // const player = {
    //     seat: -1
    // };

    const gamestate = {
        table: {
            seating: undefined
        },
        player: {
            seating: undefined
        }
        // seating: undefined
    };

    socket.on('ack-client-connect-success', state => {
        // player.seat = e.assignedseat;
        gamestate.player.seating = state.assignedseat;

        socket.emit('client-request-seating-update', { playerseatindex: gamestate.player.seating });
    });

    socket.on('ack-client-connect-fail', state => {
        alert(state.reason);
    });

    socket.on('server-response-seating-update', state => {
        gamestate.table.seating = state.seatingstate;

        drawAll(gamestate.player.seating, gamestate.table.seating);
        // updateCanvasDimensions();

        // const tableDimensions = calcTableDimensions(canvas.height / 4, canvas.width / 8);
        // const seatCoords = calcSeatCoordinates(tableDimensions.origin, tableDimensions.radius, tableDimensions.focui.length);


        // drawTable(tableDimensions);
        // drawSeats(seatCoords, gamestate.table.seating);
    });

    socket.on('game-started', state => {
        // deal em 
    });

    socket.on('connect_error', () => {
        // do something
    });


    $(window).on('resize', () => {
        // updateCanvasDimensions();

        // // player.seat = testdata.seat;
        // // state.seating = testdata.seatingstate;

        // const tableDimensions = calcTableDimensions(canvas.height / 4, canvas.width / 8);
        // const seatCoords = calcSeatCoordinates(tableDimensions.origin, tableDimensions.radius, tableDimensions.focui.length);

        // drawTable(tableDimensions);
        // drawSeats(seatCoords, state.seating);
        drawAll(gamestate.player.seating, gamestate.table.seating);
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
