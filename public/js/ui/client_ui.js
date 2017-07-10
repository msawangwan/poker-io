const div = content => $('<div></div>').text(content);

const toRadians = theta => theta * (Math.PI / 180);

// const increment = 20;
// const step = () => 2 * Math.PI / increment;

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
        const tableradius = 100;

        ctx.beginPath();

        const step = 40;

        // for (let theta = 0; theta < 2 * Math.PI; theta += step()) {
        for (let theta = 0; theta < 360; theta += step) {
            const rads = toRadians(theta);

            const x = canvasCenter[0] + tableradius * Math.cos(rads);
            const y = canvasCenter[1] + tableradius * Math.sin(rads);

            ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.stroke();
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
