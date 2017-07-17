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
    const ctx = this.canvas.getContext('2d');
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