const div = content => $('<div></div>').text(content);

const toRadians = theta => theta * (Math.PI / 180);

const cardbackpair = './asset/cards-hand-back-of-cards.jpg'

$(document).ready(() => {
    const socket = io.connect(window.location.origin);

    const canvas = document.getElementById('table-canvas');
    const ctx = canvas.getContext('2d');

    const drawCircle = () => {
        const rect = canvas.parentNode.getBoundingClientRect();

        canvas.width = rect.width;
        canvas.height = rect.height;

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const canvasCenter = [canvasWidth / 2, canvasHeight / 2];
        const tableradius = 200;

        const img_cardback = new Image();

        img_cardback.onload = () => {
            ctx.beginPath();

            const imgw = img_cardback.width;
            const imgh = img_cardback.height;
            const offsetx = imgw / 2;
            const offsety = imgh / 2;

            const step = 40;

            for (let theta = 0; theta < 360; theta += step) {
                const rads = toRadians(theta);

                const x = (canvasCenter[0] + tableradius * Math.cos(rads)) - offsetx;
                const y = (canvasCenter[1] + tableradius * Math.sin(rads)) - offsety;

                ctx.drawImage(img_cardback, x, y, imgw, imgh);

                ctx.lineTo(x, y);
            }

            ctx.closePath();
            ctx.stroke();
        };

        img_cardback.src = cardbackpair;
    };

    socket.on('update-ui-display-table', state => {
        drawCircle();
        for (const s of state.tableState) {
            if (s === 'empty seat') {
                // seat is empty
            } else {

            }
        }
    });

    $(window).on('resize', () => {
        drawCircle();
    });
});
