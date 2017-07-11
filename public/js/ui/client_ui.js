const toRadians = theta => theta * (Math.PI / 180);
const div = content => $('<div></div>').text(content);

const tableDimensions = {
    radius: 150,
    itemScale: 0.25
};

const table = {
    dimensions: {
        radius: 150,
        scale: 0.25,
        spacing: 40 // 360 / 40 === 9 seats
    },
    seating: {
        positions: new Map()
    }
}

const cardbackpair = './asset/cards-hand-back-of-cards.jpg';
const cardspritesheet = './asset/cards_52-card-deck_stylized.png';
const cardpixelwidth = 72.15;
const cardpixelheight = 83.25;

$(document).ready(() => {
    const socket = io.connect(window.location.origin);
    const canvas = document.getElementById('table-canvas');
    const ctx = canvas.getContext('2d');

    const img_cardback = new Image();
    const img_cardsheet = new Image();

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

    const drawTablePlayerPositions = () => {
        const tableradius = table.dimensions.radius;

        const originx = currentCanvasCenter.x();
        const originy = currentCanvasCenter.y();

        img_cardback.onload = () => {
            const scale = table.dimensions.scale;

            const imgw = img_cardback.width * scale;
            const imgh = img_cardback.height * scale;

            const offsetx = imgw / 2;
            const offsety = imgh / 2;

            const step = table.dimensions.spacing;

            for (let theta = 0; theta < 360; theta += step) {
                const rads = toRadians(theta);

                const x = (originx + tableradius * Math.cos(rads)) - offsetx;
                const y = (originy + tableradius * Math.sin(rads)) - offsety;

                ctx.drawImage(img_cardback, x, y, imgw, imgh);
            }
        };

        img_cardback.src = cardbackpair;
    };

    img_cardsheet.onload = () => {
        imgsrc = {
            img: img_cardsheet,
            sourcex: 0, // frame index * frame width
            sourcey: 1, // the row?
            sourcew: cardpixelwidth, // frame width
            sourceh: cardpixelheight, // frame h
            destx: 0,
            desty: 0,
            destw: cardpixelwidth,
            desty: cardpixelheight
        }
        ctx.drawImage(
            imgsrc.img,
            imgsrc.sourcex,
            imgsrc.sourcey,
            imgsrc.sourcew,
            imgsrc.sourceh,
            imgsrc.destx,
            imgsrc.desty,
            imgsrc.destw,
            imgsrc.desty
        );
    };

    img_cardsheet.src = cardspritesheet;

    socket.on('update-ui-display-table', state => {
        updateCanvasDimensions();
        drawTablePlayerPositions();
        for (const s of state.tableState) {
            if (s === 'empty seat') {
                // seat is empty
            } else {

            }
        }
    });

    $(window).on('resize', () => {
        updateCanvasDimensions();
        drawTablePlayerPositions();
    });
});
