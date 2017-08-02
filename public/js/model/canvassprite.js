class CanvasSprite {
    constructor(parentcanvas, label) {
        this.parentcanvas = parentcanvas;
        this.canvas = document.createElement('canvas');

        this.canvas.setAttribute('id', label);
    }

    initCtx(w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
        return this.canvas.getContext('2d');
    }
}

class TableSprite extends CanvasSprite {
    constructor(parentcanvas, label) {
        super(parentcanvas, label);
    }

    draw(x, y, r, o, w, h, dx, dy) {
        const ctx = this.initCtx(w, h);

        /*
            this.canvasorigin.x - this.dimensions.off, this.canvasorigin.y, this.dimensions.r
            this.canvasorigin.x + this.dimensions.off, this.canvasorigin.y, this.dimensions.r
        */

        ctx.beginPath();
        ctx.arc(x - o, y, r, Math.PI * 0.5, Math.PI * 0.5 + Math.PI);
        ctx.arc(x + o, y, r, Math.PI * 0.5 + Math.PI, Math.PI * 0.5);
        ctx.fillStyle = 'green';
        ctx.fill();

        this.parentcanvas.getContext('2d').drawImage(this.canvas, dx, dy);
    }
}

class TableSeatSprite extends CanvasSprite {
    constructor(parentcanvas, label) {
        super(parentcanvas, label);
    }

    draw(x, y, r, o, w, h, dx, dy) {
        const ctx = this.initCtx(w, h);

        /*
            this.canvas.width / 2, this.canvas.height / 2, this.dimensions.r
        */

        ctx.arc(x / 2, y / 2, r, Math.PI * 2, false);
        ctx.fillStyle = 'black';
        ctx.fill();

        this.parentcanvas.getContext('2d').drawImage(this.canvas, dx, dy);
    }
}

class TableSeatOutlineSprite extends CanvasSprite {
    constructor(parentcanvas, label) {
        super(parentcanvas, label);
    }

    draw(x, y, r, o, w, h, dx, dy) {
        const ctx = this.initCtx(w, h);

        ctx.strokeStyle = 'red';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(x / 2, y / 2, r, Math.PI * 2, false);
        ctx.stroke();

        this.parentcanvas.getContext('2d').drawImage(this.canvas, dx, dy);
    }
}