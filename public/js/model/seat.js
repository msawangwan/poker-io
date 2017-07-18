function Seat(parentCtx, position, radius, color) {
    this.position = position;
    this.id = `canvas-seat-${position}`;

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', this.id);

    this.parentCtx = parentCtx;

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
        radius: radius
    };

    this.seatColor = color;
}

Seat.prototype.render = function (x, y, tableRadius, tableOffset) {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.canvas.width = 125;
    this.canvas.height = 125;

    const localx = Math.floor(this.canvas.width * 0.5);
    const localy = Math.floor(this.canvas.height * 0.5);

    ctx.beginPath();
    ctx.arc(localx, localy, this.transform.radius, Math.PI * 2, false);
    ctx.fillStyle = this.seatColor;
    ctx.fill();

    const globalx = x + localx + tableOffset + tableRadius * 2 - this.transform.radius / 2;
    const globaly = y + localy + tableRadius;

    this.parentCtx.drawImage(this.canvas, globalx, globaly);

    this.transform.origin.local.x = localx;
    this.transform.origin.local.y = localy;
};

Seat.prototype.sit = function () {

};