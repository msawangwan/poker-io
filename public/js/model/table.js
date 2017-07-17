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

Table.prototype.render = function (width, height, scale) {
    ctx = this.canvas.getContext('2d');
    
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.canvas.width = Math.floor(width * scale);
    this.canvas.height = Math.floor(height * scale);

    const originx = this.canvas.width / 2;
    const originy = this.canvas.height / 2;
    const length = this.canvas.width / 8;
    const radius = this.canvas.height / 4;

    ctx.beginPath();

    ctx.arc(originx - length, originy, radius, Math.PI * 0.5, Math.PI * 0.5 + Math.PI);
    ctx.arc(originx + length, originy, radius, Math.PI * 0.5 + Math.PI, Math.PI * 0.5);

    ctx.stroke();

    ctx.fillStyle = 'green';
    ctx.fill();

    const offsetoriginx = width / 2 - originx;
    const offsetoriginy = height / 2 - originy;

    this.parentCtx.drawImage(this.canvas, offsetoriginx, offsetoriginy);

    this.dimensions.originx = originx;
    this.dimensions.originy = originy;
    this.dimensions.length = length;
    this.dimensions.radius = radius;
};

Table.prototype.calcPositionOnTable = function(o, radius, f) {
    const { x: ox, y: oy } = o;

    const offsetOriginLeft = ox - f;
    const offsetOriginRight = ox + f;

    const offset = f / 2;
    const thetaUpper = 25;
    const thetaLower = 325;

    const pointsOnTableCircumference = new Map([
        [-1, {
            label: 'pot-table-center',
            x: ox,
            y: oy
        }],
        [0, {
            label: 'house-center-upper',
            x: ox,
            y: oy - radius
        }],
        [1, {
            label: 'right-upper',
            x: offsetOriginRight,
            y: oy - radius
        }],
        [2, {
            label: 'right-theta-upper',
            x: offsetOriginRight + radius * Math.cos(toradian(thetaUpper)),
            y: oy - radius * Math.sin(toradian(thetaUpper))
        }],
        [3, {
            label: 'right-theta-lower',
            x: offsetOriginRight + radius * Math.cos(toradian(thetaLower)),
            y: oy - radius * Math.sin(toradian(thetaLower))
        }],
        [4, {
            label: 'right-lower',
            x: offsetOriginRight,
            y: oy + radius
        }],
        [5, {
            label: 'center-lower',
            x: ox,
            y: oy + radius
        }],
        [6, {
            label: 'left-lower',
            x: offsetOriginLeft,
            y: oy + radius
        }],
        [7, {
            label: 'left-theta-lower',
            x: offsetOriginLeft - radius * Math.cos(toradian(thetaLower)),
            y: oy - radius * Math.sin(toradian(thetaLower))
        }],
        [8, {
            label: 'left-theta-upper',
            x: offsetOriginLeft - radius * Math.cos(toradian(thetaUpper)),
            y: oy - radius * Math.sin(toradian(thetaUpper))
        }],
        [9, {
            label: 'left-upper',
            x: offsetOriginLeft,
            y: oy - radius
        }],
    ]);

    return pointsOnTableCircumference;
};

Table.prototype.createSeat = function(position) {
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