const toradian = theta => theta * (Math.PI / 180);

const thetaUpper = toradian(25);
const thetaLower = toradian(325);

const maxSeats = 9; // TODO: load from config

function Table(parentCtx) {
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', 'canvas-table');

    this.parentCtx = parentCtx;

    this.dimensions = {
        originx: 0,
        originy: 0,
        length: 0,
        radius: 0
    };

    this.seats = new Map();
}

Table.prototype.render = function (parentCanvasWidth, parentCanvasHeight, scale) {
    ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.canvas.width = Math.floor(parentCanvasWidth * scale);
    this.canvas.height = Math.floor(parentCanvasHeight * scale);

    const globalx = parentCanvasWidth * 0.5;
    const globaly = parentCanvasHeight * 0.5;
    const localx = this.canvas.width * 0.5;
    const localy = this.canvas.height * 0.5;

    const radius = this.canvas.height / 4;
    const length = Math.floor(this.canvas.width * 0.15);

    ctx.beginPath();

    ctx.arc(localx - length, localy, radius, Math.PI * 0.5, Math.PI * 0.5 + Math.PI);
    ctx.arc(localx + length, localy, radius, Math.PI * 0.5 + Math.PI, Math.PI * 0.5);

    ctx.fillStyle = 'green';
    ctx.fill();

    this.parentCtx.drawImage(this.canvas, (parentCanvasWidth * 0.5) - this.canvas.width / 2, (parentCanvasHeight * 0.5) - localy);

    this.dimensions.originx = localx;
    this.dimensions.originy = localy;
    this.dimensions.radius = radius;
    this.dimensions.offset = length;
};

Table.prototype.pointOnTable = function (position) {
    const ox = this.dimensions.originx;
    const oy = this.dimensions.originy;
    const r = this.dimensions.radius;
    const off = this.dimensions.offset;

    const offsetLeft = ox - off;
    const offsetRight = ox + off;

    const seatRadius = 0;

    let x = -1;
    let y = -1;

    switch (position) {
        case -1: // center
            x = ox;
            y = oy;
            break;
        case -2: // center upper
            x = ox;
            y = oy - r;
            break;
        case 0: // right upper
            x = offsetRight;
            y = oy - r;
            break;
        case 1: // right theta upper
            x = offsetRight + r * Math.cos(thetaUpper) - (seatRadius / 2);
            y = oy - r * Math.sin(thetaUpper);
            break;
        case 2: // right theta lower
            x = offsetRight + r * Math.cos(thetaLower) - (seatRadius / 2);
            y = oy - r * Math.sin(thetaLower);
            break;
        case 3: // right lower
            x = offsetRight;
            y = oy + r + (seatRadius / 2);
            break;
        case 4: // center lower
            x = ox;
            y = oy + r + (seatRadius / 2);
            break;
        case 5: // left lower
            x = offsetLeft;
            y = oy + r + (seatRadius / 2);
            break;
        case 6: // left theta lower
            x = offsetLeft - r * Math.cos(thetaLower);
            y = oy - r * Math.sin(thetaLower);
            break;
        case 7: // left theta upper
            x = offsetLeft - r * Math.cos(thetaUpper);
            y = oy - r * Math.sin(thetaUpper);
            break;
        case 8: // left upper
            x = offsetLeft;
            y = oy - r;
            break;
        default:
            break;
    }

    return {
        x: x, y: y
    };
};

Table.prototype.createSeat = function (position) {
    if (this.seats.size > maxSeats) {
        return false;
    }

    this.seats.set(position, {
        vacant: true,
        player: undefined
    });
};

Table.prototype.seatPlayer = function (position, player) {

};