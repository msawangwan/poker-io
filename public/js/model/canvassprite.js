class CanvasSprite {
    constructor(parentcanvas, label) {
        this.parentcanvas = parentcanvas;
        this.canvas = document.createElement('canvas');

        this.canvas.setAttribute('id', label);
    }
}

class TableSprite extends CanvasSprite {
    constructor(parentcanvas, label) {
        super(parentcanvas, label);
    }

    draw(x, y, w, h) {
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.canvas.width = this.dimensions.w;
        this.canvas.height = this.dimensions.h;

        ctx.beginPath();
        ctx.arc(this.canvasorigin.x - this.dimensions.off, this.canvasorigin.y, this.dimensions.r, Math.PI * 0.5, Math.PI * 0.5 + Math.PI);
        ctx.arc(this.canvasorigin.x + this.dimensions.off, this.canvasorigin.y, this.dimensions.r, Math.PI * 0.5 + Math.PI, Math.PI * 0.5);
        ctx.fillStyle = 'green';
        ctx.fill();

        this.parentcanvas.getContext('2d').drawImage(this.canvas, this.postion.x, this.postion.y);
    }
}