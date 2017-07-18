function Seat(position, radius, color) {
    this.position = position;
    this.id = `canvas-seat-${position}`;

    this.seatColor = color;

    this.vacant = true;
    this.occupant = undefined;

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', this.id);

    // this.canvas.setAttribute('grid-area', 'canvas');
    // document.getElementById('container-canvas').appendChild(this.canvas);

    this.canvas.width = radius * 2;
    this.canvas.height = radius * 2;

    this.transform = {
        origin: {
            local: {
                x: 0,
                y: 0
            },
            global: {
                x: 0,
                y: 0
            }
        },
        w: 0,
        h: 0,
        radius: radius
    };

    this.transformState = {
        changed: false,
        rendered: false
    };
}

Seat.prototype.calcTransform = function (globalx, globaly, tableradius, tableoffset) {
    const t = this.transform;

    t.w = t.radius * 2;
    t.h = t.w;

    t.origin.local.x = Math.floor(t.w * 0.5);
    t.origin.local.y = Math.floor(t.h * 0.5);

    t.origin.global.x = globalx + tableradius * 2 + tableoffset / 2 + t.radius * 2;
    t.origin.global.y = globaly + tableradius + t.radius * 2;

    this.transform = t;
};

Seat.prototype.render = function (toParentCanvas) {
    const t = this.transform;

    this.canvas.width = t.w;
    this.canvas.height = t.h;

    const localctx = this.canvas.getContext('2d');

    localctx.clearRect(0, 0, t.w, t.h);
    localctx.arc(t.origin.local.x, t.origin.local.y, t.radius, Math.PI * 2, false);
    localctx.fillStyle = this.seatColor;
    localctx.fill();

    toParentCanvas.getContext('2d').drawImage(this.canvas, t.origin.global.x, t.origin.global.y);
};

Seat.prototype.sit = function () {

};