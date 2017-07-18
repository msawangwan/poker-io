const toradian = theta => theta * (Math.PI / 180);

const thetaUpper = toradian(25);
const thetaLower = toradian(325);

const maxSeats = 9; // TODO: load from config

function Table(parentCtx) {
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', 'canvas-table');

    // $('#canvas-table').appendTo($('#static-canvas'));
    // $('#canvas-table').css('border', 'solid 2px red');

    this.parentCtx = parentCtx;

    this.transform = {
        originx: 0,
        originy: 0,
        radius: 0,
        offset: 0
    };

    this.seats = new Map();
}

Table.prototype.render = function (parentCanvasWidth, parentCanvasHeight, scale) {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.canvas.width = Math.floor(parentCanvasWidth * scale);
    this.canvas.height = Math.floor(parentCanvasHeight * scale);


    const localx = this.canvas.width * 0.5;
    const localy = this.canvas.height * 0.5;

    const radius = Math.floor(this.canvas.height / 4);
    const length = Math.floor(this.canvas.width * 0.15);

    ctx.beginPath();

    ctx.arc(localx - length, localy, radius, Math.PI * 0.5, Math.PI * 0.5 + Math.PI);
    ctx.arc(localx + length, localy, radius, Math.PI * 0.5 + Math.PI, Math.PI * 0.5);

    ctx.fillStyle = 'green';
    ctx.fill();

    const globalx = parentCanvasWidth / 2 - localx;
    const globaly = parentCanvasHeight / 2 - localy;

    this.parentCtx.drawImage(this.canvas, globalx, globaly);

    this.transform.originx = localx;
    this.transform.originy = localy;
    this.transform.radius = radius;
    this.transform.offset = length;
};

Table.prototype.pointOnTable = function (position) {
    const ox = this.transform.originx;
    const oy = this.transform.originy;
    const r = this.transform.radius;
    const off = this.transform.offset;

    const offsetLeft = ox - off;
    const offsetRight = ox + off;

    const seatRadius = 0;

    let x = -1;
    let y = -1;

    switch (position) {
        case -2: // center
            x = ox;
            y = oy;
            break;
        case -1: // center upper
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