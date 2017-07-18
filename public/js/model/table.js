const toradian = theta => theta * (Math.PI / 180);

const thetaUpper = toradian(25);
const thetaLower = toradian(325);

const maxSeats = 9; // TODO: load from config

function Table(parentCtx) {
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', 'canvas-table');

    this.seats = new Map();

    this.transform = {
        local: {
            center: {
                x: 0,
                y: 0
            }
        },
        global: {
            centeredAt: {
                x: 0,
                y: 0,
            }
        },
        w: 0,
        h: 0,
        radius: 0,
        offset: 0,
    };

    this.renderState = {
        rendered: false,
        renderOnNextPass: false
    };
}

Table.prototype.calcDimensions = function (parentCanvasWidth, parentCanvasHeight, scale) {
    const t = this.transform;

    t.w = Math.floor(parentCanvasWidth * scale);
    t.h = Math.floor(parentCanvasHeight * scale);

    t.local.center.x = Math.floor(t.w * 0.5);
    t.local.center.y = Math.floor(t.h * 0.5);

    t.global.centeredAt.x = parentCanvasWidth / 2 - t.local.center.x;
    t.global.centeredAt.y = parentCanvasHeight / 2 - t.local.center.y;

    t.radius = Math.floor(t.h / 4);
    t.offset = Math.floor(t.w * 0.15);

    this.transform = t;
};

Table.prototype.render = function (toParentCanvas) {
    const t = this.transform;

    this.canvas.width = t.w;
    this.canvas.height = t.h;

    const localctx = this.canvas.getContext('2d');

    localctx.clearRect(0, 0, t.w, t.h);
    localctx.beginPath();
    localctx.arc(t.local.center.x - t.offset, t.local.center.y, t.radius, Math.PI * 0.5, Math.PI * 0.5 + Math.PI);
    localctx.arc(t.local.center.x + t.offset, t.local.center.y, t.radius, Math.PI * 0.5 + Math.PI, Math.PI * 0.5);
    localctx.fillStyle = 'green';
    localctx.fill();

    toParentCanvas.getContext('2d').drawImage(this.canvas, t.global.centeredAt.x, t.global.centeredAt.y);
};

Table.prototype.renderORIGINAL = function (toParentCanvas, parentCanvasWidth, parentCanvasHeight, scale) {
    const localctx = this.canvas.getContext('2d');

    localctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.canvas.width = Math.floor(parentCanvasWidth * scale);
    this.canvas.height = Math.floor(parentCanvasHeight * scale);

    const localx = Math.floor(this.canvas.width * 0.5);
    const localy = Math.floor(this.canvas.height * 0.5);

    const radius = Math.floor(this.canvas.height / 4);
    const length = Math.floor(this.canvas.width * 0.15);

    localctx.beginPath();

    localctx.arc(localx - length, localy, radius, Math.PI * 0.5, Math.PI * 0.5 + Math.PI);
    localctx.arc(localx + length, localy, radius, Math.PI * 0.5 + Math.PI, Math.PI * 0.5);

    localctx.fillStyle = 'green';
    localctx.fill();

    const globalx = parentCanvasWidth / 2 - localx;
    const globaly = parentCanvasHeight / 2 - localy;

    toParentCanvas.getContext('2d').drawImage(this.canvas, globalx, globaly);

    this.transform.local.center.x = localx;
    this.transform.local.center.y = localy;

    this.transform.radius = radius;
    this.transform.offset = length;

    this.transform.global.centeredAt.x = globalx;
    this.transform.global.centeredAt.y = globaly;
};

Table.prototype.pointOnTable = function (position) {
    const ox = this.transform.global.centeredAt.x;
    const oy = this.transform.global.centeredAt.y;
    const r = this.transform.radius;
    const off = this.transform.offset;

    const offsetLeft = ox - off;
    const offsetRight = ox + off;

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
            x = offsetRight + r * Math.cos(thetaUpper);
            y = oy - r * Math.sin(thetaUpper);
            break;
        case 2: // right theta lower
            x = offsetRight + r * Math.cos(thetaLower);
            y = oy - r * Math.sin(thetaLower);
            break;
        case 3: // right lower
            x = offsetRight;
            y = oy + r;
            break;
        case 4: // center lower
            x = ox;
            y = oy + r;
            break;
        case 5: // left lower
            x = offsetLeft;
            y = oy + r;
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

Table.prototype.getTablePosByIndex = function (index) {
    if (coords) {
        const pos = coords.get(index);
        if (pos) {
            return {
                x: pos.x,
                y: pos.y
            }
        }
    }
};

Table.prototype.addSeat = function (seat) {
    if (this.seats.size > maxSeats) {
        return false;
    }

    this.seats.set(seat.position, seat);

    return true;
};

Table.prototype.seatPlayer = function (position, player) {

};