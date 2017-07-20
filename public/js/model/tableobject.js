const scalingvalue = 0.65;

class TableObject {
    constructor(maxseats, parentcanvas) {
        this.maxseats = maxseats;

        this.parentcanvas = parentcanvas;

        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('id', 'canvas-table');

        this.seats = new Map();

        this.postion = {
            x: 0, y: 0
        };

        this.canvasorigin = {
            x: 0, y: 0
        }

        this.dimensions = {
            w: 0, h: 0, r: 0, off: 0
        };

        this.labels = {
            center: null
        };

        this.drawOnNextUpdate = false;
    };

    render() {
        if (this.drawOnNextUpdate) {
            console.log('drawing table');

            this.drawOnNextUpdate = false;

            this.resize();
            this.draw();
        }
    }

    resize() {
        this.dimensions.w = Math.floor(this.parentcanvas.width * scalingvalue);
        this.dimensions.h = Math.floor(this.parentcanvas.height * scalingvalue);

        this.canvasorigin.x = Math.floor(this.dimensions.w * 0.5);
        this.canvasorigin.y = Math.floor(this.dimensions.h * 0.5);

        this.postion.x = Math.floor(this.parentcanvas.width / 2 - this.canvasorigin.x);
        this.postion.y = Math.floor(this.parentcanvas.height / 2 - this.canvasorigin.y);

        this.dimensions.r = Math.floor(this.dimensions.h / 4);
        this.dimensions.off = Math.floor(this.dimensions.w * 0.15);
    };

    draw() {
        this.canvas.width = this.dimensions.w;
        this.canvas.height = this.dimensions.h;

        const ctx = this.canvas.getContext('2d');

        ctx.clearRect(0, 0, this.dimensions.w, this.dimensions.h);
        ctx.beginPath();
        ctx.arc(this.canvasorigin.x - this.dimensions.off, this.canvasorigin.y, this.dimensions.r, Math.PI * 0.5, Math.PI * 0.5 + Math.PI);
        ctx.arc(this.canvasorigin.x + this.dimensions.off, this.canvasorigin.y, this.dimensions.r, Math.PI * 0.5 + Math.PI, Math.PI * 0.5);
        ctx.fillStyle = 'green';
        ctx.fill();

        this.parentcanvas.getContext('2d').drawImage(this.canvas, this.postion.x, this.postion.y);
    };
}