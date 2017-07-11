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

    const createCard = (spritesheet, w, h) => {
        return {
            img: spritesheet,
            width: w,
            height: h,
        }
    };

    const getCardAtIndex = (s, v) => {
        console.log(s + ' ' + v);
        ctx.drawImage(
            img_cardsheet,
            v * cardpixelwidth, // frame index * frame width
            s * cardpixelheight, // frame row?
            cardpixelwidth, // frame width
            cardpixelheight, // frame height
            s * v, // dest x
            s, // dest y
            cardpixelwidth, // frame width on draw (same as input usually)
            cardpixelheight // frame height on draw (same as input usually)
        );
    };

    let suite = 0;
    let v = 0;

    img_cardsheet.onload = () => {
        setInterval(() => {
            if (suite >= 4) {
                suite = 0;
            }

            if (v >= 13) {
                v = 0;
            }

            getCardAtIndex(suite, v);
            suite += 1;
            v += 1;
        }, 750);
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
