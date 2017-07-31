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

    draw(x, y, r, w, h, dx, dy) {
        this.canvas.width = w;
        this.canvas.height = h;

        const ctx = this.canvas.getContext('2d');

        const ox = this.parentcanvas.width * 0.65;
        const oy = this.parentcanvas.height * 0.65
        /*
            this.canvasorigin.x - this.dimensions.off, this.canvasorigin.y, this.dimensions.r
            this.canvasorigin.x + this.dimensions.off, this.canvasorigin.y, this.dimensions.r
        */

        ctx.beginPath();
        ctx.arc(x, y, r, Math.PI * 0.5, Math.PI * 0.5 + Math.PI);
        ctx.arc(x, y, r, Math.PI * 0.5 + Math.PI, Math.PI * 0.5);
        ctx.fillStyle = 'green';
        ctx.fill();

        this.parentcanvas.getContext('2d').drawImage(this.canvas, dx, dy);
    }
}

class TableSeatSprite extends CanvasSprite {
    constructor(parentcanvas, label) {
        super(parentcanvas, label);
    }

    draw(x, y, r, w, h, dx, dy) {
        this.canvas.width = w;
        this.canvas.height = h;

        const ctx = this.canvas.getContext('2d');

        /*
            this.canvas.width / 2, this.canvas.height / 2, this.dimensions.r
        */

        ctx.arc(x, y, r, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();

        this.parentcanvas.getContext('2d').drawImage(this.canvas, dx, dy);
    }
}