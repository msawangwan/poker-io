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

    const drawTablePlayerPositions = () => {
        const tableradius = table.dimensions.radius;

        const originx = currentCanvasCenter.x();
        const originy = currentCanvasCenter.y();

        const img_cardback = new Image();

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
