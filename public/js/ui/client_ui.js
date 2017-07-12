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

        const focuileft = ox - f;
        const focuiright = ox + f;

        const offset = f / 2;

        // [[posindex, 'label'], [coordx, coordy]]
        const seating = new Map([
            [-1, { label: 'pot', x: ox, y: oy }],
            [0, { label: 'dealer', x: ox, y: oy - radius }],
            [1, { label: 'right-upper', x: focuiright, y: oy - radius }],
            [2, { label: 'right', x: focuiright + radius, y: oy }],
            [3, { label: 'right-lower', x: focuiright, y: oy + radius }],
            [4, { label: 'center-right-lower', x: ox + offset, y: oy + radius }],
            [5, { label: 'center-lower', x: ox, y: oy + radius }],
            [6, { label: 'center-left-lower', x: ox - offset, y: oy + radius }],
            [7, { label: 'left-lower', x: focuileft, y: oy + radius }],
            [8, { label: 'left', x: focuileft - radius, y: oy }],
            [9, { label: 'left-upper', x: focuileft, y: oy - radius }],
        ]);
        // const seating = new Map([
        //     [[-1, 'pot'], [ox, oy]],
        //     [[0, 'dealer'], [ox, oy - radius]],
        //     [[1, 'right-upper'], [focuiright, oy - radius]],
        //     [[2, 'right'], [focuiright + radius, oy]],
        //     [[3, 'right-lower'], [focuiright, oy + radius]],
        //     [[4, 'center-right-lower'], [ox + offset, oy + radius]],
        //     [[5, 'center-lower'], [ox, oy + radius]],
        //     [[6, 'center-left-lower'], [ox - offset, oy + radius]],
        //     [[7, 'left-lower'], [focuileft, oy + radius]],
        //     [[8, 'left'], [focuileft - radius, oy]],
        //     [[9, 'left-upper'], [focuileft, oy - radius]],
        // ]);

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

    const drawSeats = seating => {
        const size = 35;
        const circle = Math.PI * 2;

        // [[posindex, 'label'], [coordx, coordy]]
        for (const [position, coord] of seating.entries()) {
            ctx.beginPath();
            ctx.moveTo(coord.x, coord.y);
            ctx.arc(coord.x, coord.y, size, circle, false);
            ctx.stroke();
            ctx.fillStyle = 'yellow';
            ctx.fill();
        }

        // ctx.beginPath();
        // ctx.moveTo(seating.rightupper.x, seating.rightupper.y);
        // ctx.arc(seating.rightupper.x, seating.rightupper.y, size, circle, false);
        // ctx.stroke();
        // ctx.fillStyle = 'yellow';
        // ctx.fill();
        // ctx.beginPath();
        // ctx.moveTo(seating.right.x, seating.right.y);
        // ctx.arc(seating.right.x, seating.right.y, size, circle, false);
        // ctx.stroke();
        // ctx.fillStyle = 'red';
        // ctx.fill();
        // ctx.beginPath();
        // ctx.moveTo(seating.rightlower.x, seating.rightlower.y);
        // ctx.arc(seating.rightlower.x, seating.rightlower.y, size, circle, false);
        // ctx.stroke();
        // ctx.fillStyle = 'orange';
        // ctx.fill();
        // ctx.beginPath();
        // ctx.moveTo(seating.centerrightlower.x, seating.centerrightlower.y);
        // ctx.arc(seating.centerrightlower.x, seating.centerrightlower.y, size, circle, false);
        // ctx.stroke();
        // ctx.fillStyle = 'yellow';
        // ctx.fill();
        // ctx.beginPath();
        // ctx.moveTo(seating.centerlower.x, seating.centerlower.y);
        // ctx.arc(seating.centerlower.x, seating.centerlower.y, size, circle, false);
        // ctx.stroke();
        // ctx.fillStyle = 'purple';
        // ctx.fill();
        // ctx.beginPath();
        // ctx.moveTo(seating.centerleftlower.x, seating.centerleftlower.y);
        // ctx.arc(seating.centerleftlower.x, seating.centerleftlower.y, size, circle, false);
        // ctx.stroke();
        // ctx.fillStyle = 'orange';
        // ctx.fill();
        // ctx.beginPath();
        // ctx.moveTo(seating.leftlower.x, seating.leftlower.y);
        // ctx.arc(seating.leftlower.x, seating.leftlower.y, size, circle, false);
        // ctx.stroke();
        // ctx.fillStyle = 'yellow';
        // ctx.fill();
        // ctx.beginPath();
        // ctx.moveTo(seating.left.x, seating.left.y);
        // ctx.arc(seating.left.x, seating.left.y, size, circle, false);
        // ctx.stroke();
        // ctx.fillStyle = 'purple';
        // ctx.fill();
        // ctx.beginPath();
        // ctx.moveTo(seating.leftupper.x, seating.leftupper.y);
        // ctx.arc(seating.leftupper.x, seating.leftupper.y, size, circle, false);
        // ctx.stroke();
        // ctx.fillStyle = 'red';
        // ctx.fill();

        const text = ctx.measureText('pot size: 0');

        ctx.beginPath();
        ctx.font = '24px serif';
        ctx.fillStyle = 'white';
        ctx.fillText('pot size: 0', seating.get([-1, 'pot'])[0] - text.width, seating.get([-1, 'pot'])[1]);
    };

    const player = {
        seat: -1
    };

    socket.on('ack-client-connect-success', e => {
        player.seat = e.assignedseat;

        socket.emit('client-request-seating-update', { playerseatindex: player.seat });
    });

    socket.on('ack-client-connect-fail', e => {
        alert(e.reason);
    });

    socket.on('server-response-seating-update', e => {
        console.log(e.seatingstate);
        updateCanvasDimensions();

        const tableDimensions = calcTableDimensions(canvas.height / 4, canvas.width / 8);
        const seatCoords = calcSeatCoordinates(tableDimensions.origin, tableDimensions.radius, tableDimensions.focui.length);

        drawTable(tableDimensions);
        drawSeats(seatCoords);
    });

    $(window).on('resize', () => {
        updateCanvasDimensions();

        const tableDimensions = calcTableDimensions(canvas.height / 4, canvas.width / 8);
        const seatCoords = calcSeatCoordinates(tableDimensions.origin, tableDimensions.radius, tableDimensions.focui.length);

        drawTable(tableDimensions);
        drawSeats(seatCoords);
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
