// const toradian = theta => theta * (Math.PI / 180);

// const thetaUpper = toradian(25);
// const thetaLower = toradian(325);

const determineCoordinatesOnTable = (seatPosition, seatRadius, tableOriginx, tableOriginy, tableRadius, tableFocusOffset) => {
    // const ox = tableOriginx;
    // const oy = tableOriginy;
    // const r = tableRadius;
    // const off = tableFocusOffset;

    // const offsetLeft = ox - off;
    // const offsetRight = ox + off;

    // let x = -1;
    // let y = -1;

    // switch (seatPosition) {
    //     case 0: // right upper
    //         x = offsetRight;
    //         y = oy - r;
    //         break;
    //     case 1: // right theta upper
    //         x = offsetRight + r * Math.cos(thetaUpper) - (seatRadius / 2);
    //         y = oy - r * Math.sin(thetaUpper);
    //         break;
    //     case 2: // right theta lower
    //         x = offsetRight + r * Math.cos(thetaLower) - (seatRadius / 2);
    //         y = oy - r * Math.sin(thetaLower);
    //         break;
    //     case 3: // right lower
    //         x = offsetRight;
    //         y = oy + r + (seatRadius / 2);
    //         break;
    //     case 4: // center lower
    //         x = ox;
    //         y = oy + r + (seatRadius / 2);
    //         break;
    //     case 5: // left lower
    //         x = offsetLeft;
    //         y = oy + r + (seatRadius / 2);
    //         break;
    //     case 6: // left theta lower
    //         x = offsetLeft - r * Math.cos(thetaLower);
    //         y = oy - r * Math.sin(thetaLower);
    //         break;
    //     case 7: // left theta upper
    //         x = offsetLeft - r * Math.cos(thetaUpper);
    //         y = oy - r * Math.sin(thetaUpper);
    //         break;
    //     case 8: // left upper
    //         x = offsetLeft;
    //         y = oy - r;
    //         break;
    //     default:
    //         break;
    // }

    // return {
    //     x: x, y: y
    // };
};

function Seat(parentCtx, position, radius, color) {
    this.position = position;

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', `canvas-seat-${position}`);

    this.parentCtx = parentCtx;

    this.global = {
        x: 0,
        y: 0
    };

    this.seatRadius = radius;
    this.seatColor = color;
}

Seat.prototype.render = function (x, y) {
    ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.canvas.width = 300;
    this.canvas.height = 300;

    const localx = this.canvas.width / 2;
    const localy = this.canvas.height / 2;

    ctx.beginPath();
    ctx.arc(localx, localy, this.seatRadius, Math.PI * 2, false);
    ctx.fillStyle = this.seatColor;
    ctx.fill();

    this.parentCtx.drawImage(this.canvas, x, y);

    this.global.x = x;
    this.global.y = y;
};

Seat.prototype.sit = function () {

};