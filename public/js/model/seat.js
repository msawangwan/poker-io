function Seat(parentCtx, position, radius, color) {
    this.position = position;
    this.id = `canvas-seat-${position}`;

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', this.id);

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
        radius: radius
    };

    this.seatColor = color;
}

Seat.prototype.render = function (toParentCanvas, atX, atY, tableRadius, tableOffset) {
    const localctx = this.canvas.getContext('2d');
    localctx.clearRect(0, 0, this.canvas.width, this.canvas.height);;
    
    this.canvas.width = this.transform.radius * 2;
    this.canvas.height = this.transform.radius * 2;

    const localx = Math.floor(this.canvas.width * 0.5);
    const localy = Math.floor(this.canvas.height * 0.5);

    localctx.beginPath();
    localctx.arc(localx, localy, this.transform.radius, Math.PI * 2, false);
    localctx.fillStyle = this.seatColor;
    localctx.fill();

    const globalx = atX + tableOffset + tableOffset * 2;
    const globaly = atY + tableRadius + this.transform.radius;

    toParentCanvas.getContext('2d').drawImage(this.canvas, globalx, globaly);

    this.transform.origin.local.x = localx;
    this.transform.origin.local.y = localy;
    this.transform.origin.global.x = globalx;
    this.transform.origin.global.y = globaly;
    
    console.log(tableRadius, tableOffset);
    console.log(this.transform.origin.global);
};

Seat.prototype.sit = function () {

};