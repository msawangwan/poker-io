class Sprite {
    constructor(parentcanvas, src) {
        this.parentcanvas = parentcanvas;
        this.src = src;
    }

    render(x, y, row, col, w, h) {
        const img = new Image();

        img.onload = () => {
            const ctx = this.parentcanvas.getContext('2d');
            ctx.drawImage(img, row * w, col * h, w, h, x, y, w, h);
        };

        img.src = this.src;
    }

    renderScaled(x, y, row, col, w, h, sx, sy) {
        const img = new Image();

        img.onload = () => {
            const ctx = this.parentcanvas.getContext('2d');
            ctx.drawImage(img, row * w, col * h, w, h, x, y, w * sx, h * sy);
        };

        img.src = this.src;
    }

    erase(x, y, w, h, sx, sy) {
        const ctx = this.parentcanvas.getContext('2d');
        ctx.clearRect(x, y, w * sx, h * sy);
    }
}