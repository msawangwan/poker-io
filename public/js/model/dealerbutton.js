class DealerButton {
    constructor(parentcanvas) {
        this.parentcanvas = parentcanvas;

        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('id', 'canvas-dealer-button');
    };

    draw(x, y, w, h, r) {
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.canvas.width = w;
        this.canvas.height = h;

        ctx.beginPath();
        ctx.arc(this.canvas.width / 2, this.canvas.height / 2, r, Math.PI * 2, false);
        ctx.fillStyle = 'yellow';
        ctx.fill();

        this.parentcanvas.getContext('2d').drawImage(this.canvas, x, y);
    };
}