function Table(container, parentCtx) {
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', 'canvas-table');


    this.ctx = this.canvas.getContext('2d');
    this.parentCtx = parentCtx;
}

Table.prototype.render = function (width, height) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.canvas.width = width / 2;
    this.canvas.height = height / 2;

    const length = this.canvas.width / 8;
    const radius = this.canvas.height / 4;

    const originx = this.canvas.width / 2;
    const originy = this.canvas.height / 2;

    this.ctx.beginPath();

    this.ctx.arc(originx - length, originy, radius, Math.PI * 0.5, Math.PI * 0.5 + Math.PI);
    this.ctx.arc(originx + length, originy, radius, Math.PI * 0.5 + Math.PI, Math.PI * 0.5);

    this.ctx.stroke();

    this.ctx.fillStyle = 'green';
    this.ctx.fill();

    const offsetoriginx = (width / 2) - (this.canvas.width / 2)
    const offsetoriginy = (height / 2) - (this.canvas.height / 2);

    this.parentCtx.drawImage(this.canvas, offsetoriginx, offsetoriginy);
};

Table.prototype.seatPlayer = function (position, player) {

};