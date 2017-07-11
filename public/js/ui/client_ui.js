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

    const drawTable = (radius, armlength) => {
        const originx = currentCanvasCenter.x();
        const originy = currentCanvasCenter.y();

        const tableradius = radius;
        const focui = armlength;

        const focuileft = originx - armlength;
        const focuiright = originx + armlength;

        ctx.beginPath();

        ctx.arc(focuileft, originy, tableradius, Math.PI * 0.5, Math.PI * 0.50 + Math.PI);
        ctx.arc(focuiright, originy, tableradius, Math.PI * 0.50 + Math.PI, Math.PI * 0.5);

        ctx.moveTo(focuiright, originy + tableradius);
        ctx.lineTo(focuileft, originy + tableradius);

        ctx.stroke();
        ctx.fillStyle = 'green';
        ctx.fill();
        ctx.fillStyle = 'white';

        return {
            origin: {
                x: originx,
                y: originy
            },
            radius: tableradius,
            focui: armlength
        }
    };

    const drawSeating = (o, radius, f) => {
        const { x: ox, y: oy } = o;

        const focuileft = ox - f;
        const focuiright = ox + f;

        const offset = f / 2;

        const seating = {
            center: { pos: -1, x: ox, y: oy },
            centerupper: [0, [ox, oy - radius]],
            rightupper: [1, [focuiright, oy - radius]],
            right: [2, [focuiright + radius, oy]],
            rightlower: [3, [focuiright, oy + radius]],
            centerrightlower: [4, [ox + offset, oy + radius]],
            centerlower: [5, [ox, oy + radius]],
            centerleftlower: [6, [ox - offset, oy + radius]],
            leftlower: [7, [focuileft, oy + radius]],
            left: [8, [focuileft - radius, oy]],
            leftupper: [9, [focuileft, oy - radius]],
        }

        ctx.font = '44px serif';

        // ctx.fillText('center', ox, oy);              // center, -1
        ctx.fillText('center', seating.center.x, seating.center.y);              // center, -1
        ctx.fillText('0', focuiright, oy - radius);  // rightupper, 0
        ctx.fillText('0', focuiright + radius, oy);  // right, 1
        ctx.fillText('0', focuiright, oy + radius);  // rightlower, 2
        ctx.fillText('0', ox + offset, oy + radius); // centerrightlower, 3
        ctx.fillText('0', ox, oy + radius);          // centerlower, 4
        ctx.fillText('0', ox - offset, oy + radius); // centerleftlower, 5
        ctx.fillText('0', focuileft, oy + radius);   // leftlower, 6
        ctx.fillText('0', focuileft - radius, oy);   // left, 7
        ctx.fillText('0', focuileft, oy - radius);   // leftupper, 8 
        ctx.fillText('0', ox, oy - radius);          // centerupper, 10

        return seating;
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

        const tableDimensions = drawTable(canvas.height / 4, canvas.width / 8);
        drawSeating(tableDimensions.origin, tableDimensions.radius, tableDimensions.focui);
    });

    $(window).on('resize', () => {
        updateCanvasDimensions();
        const tableDimensions = drawTable(canvas.height / 4, canvas.width / 8);
        drawSeating(tableDimensions.origin, tableDimensions.radius, tableDimensions.focui);
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
