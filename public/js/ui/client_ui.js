const toRadians = theta => theta * (Math.PI / 180);
const div = content => $('<div></div>').text(content);

const table = {
    dimensions: {
        radius: 450,
        scale: 0.25,
        spacing: 360 / 12 // 360 / 40 === 9 seats
    },
    seating: {
        positions: new Map()
    }
};

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
        const seatingCoordinates = new Map();

        const originx = currentCanvasCenter.x();
        const originy = currentCanvasCenter.y();

        const tableradius = radius;
        const focui = armlength;

        // seatingCoordinates.set(-1, {
        //     x: originx,
        //     y: originy - tableradius
        // });

        // seatingCoordinates.set(0, {
        //     x: originx + focui,
        //     y: tableradius
        // });

        // const leftoriginx = originx + focui;
        // const leftoriginy = originy + focui;

        // seatingCoordinates.set(1, {
        //     x: leftoriginx + tableradius * Math.cos(toRadians(45)),
        //     y: leftoriginy + tableradius * Math.sin(toRadians(45))
        // });

        // seatingCoordinates.set(2, {
        //     x: leftoriginx + tableradius,
        //     y: leftoriginy + tableradius
        // });

        // seatingCoordinates.set(3, {
        //     x: originx - focui,
        //     y: originy + tableradius
        // });

        // seatingCoordinates.set(4, {
        //     x: originx - focui,
        //     y: originy + tableradius
        // });

        ctx.beginPath();

        ctx.arc(originx + focui * -1, originy, tableradius, Math.PI * 0.5, Math.PI * 0.50 + Math.PI);
        ctx.arc(originx + focui, originy, tableradius, Math.PI * 0.50 + Math.PI, Math.PI * 0.5);

        ctx.moveTo(originx + focui, originy + tableradius);
        ctx.lineTo(originx - focui, originy + tableradius);

        ctx.stroke();

        // ctx.fillStyle = 'green';
        // ctx.fill();

        // for (const [index, pos] in seatingCoordinates.entries()) {
        //     ctx.font = '44px serif';
        //     ctx.fillText('gg', pos.x + tableradius, pos.y + tableradius);
        // }

        const focuileft = originx - focui;
        const focuiright = originx + focui;
        const offset = focui / 8;

        ctx.font = '44px serif';

        ctx.fillText('center', originx, originy); // center
        ctx.fillText('0', focuileft - tableradius, originy); // left
        ctx.fillText('0', focuiright + tableradius, originy); // right
        ctx.fillText('0', originx, originy - tableradius); // centerupper
        ctx.fillText('0', focuileft, originy - tableradius); // leftupper
        ctx.fillText('0', focuiright, originy - tableradius); // rightupper
        ctx.fillText('0', originx - 50, originy + tableradius); // centerleftlower
        ctx.fillText('0', originx + 50, originy + tableradius); // centerrightlower
        ctx.fillText('0', focuileft, originy + tableradius); // leftlower
        ctx.fillText('0', focuiright, originy + tableradius); // rightlower

        return seatingCoordinates;
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
        drawTable(150, 300);
    });

    $(window).on('resize', () => {
        updateCanvasDimensions();
        drawTable(150, 300);
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
