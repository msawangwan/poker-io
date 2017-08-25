class SpriteRenderer {
    constructor(canvas, src) {
        this.buf = document.createElement('canvas');

        this.canvas = canvas;
        this.src = src;

        this.img = null;
    }

    render(transform, tint) {
        const { dx, dy, row, col, w, h, scale } = transform;

        if (!tint && this.img && this.img.complete) {
            this.img.onload();
        } else {
            const img = new Image();

            img.onload = () => {
                let buftint = null;
                let alphatint = 1.0;

                const r = row * w;
                const c = col * h;
                const sw = w * scale;
                const sh = h * scale;

                this.buf.width = w;
                this.buf.height = h;

                const canvasctx = this.canvas.getContext('2d');
                const bufctx = this.buf.getContext('2d');

                // method for tinting adopted from:
                // https://stackoverflow.com/questions/2688961/how-do-i-tint-an-image-with-html5-canvas

                if (tint) {
                    alphatint = 0.25;
                    buftint = document.createElement('canvas');

                    buftint.width = w;
                    buftint.height = h;

                    const buftintctx = buftint.getContext('2d');

                    buftintctx.fillStyle = tint.color;
                    buftintctx.fillRect(0, 0, w, h);

                    buftintctx.globalCompositeOperation = "destination-atop";
                    buftintctx.drawImage(img, r, c, w, h, 0, 0, sw, sh);
                }

                bufctx.drawImage(img, r, c, w, h, 0, 0, sw, sh);

                canvasctx.globalAlpha = alphatint;
                canvasctx.drawImage(this.buf, dx, dy);

                if (buftint) {
                    canvasctx.drawImage(buftint, dx, dy);
                }

                canvasctx.globalAlpha = 1.0;
            };

            img.src = this.src;

            this.img = img;
        }
    }

    static createTransform(w, h, x, y, row, col, scale) {
        return {
            w: w,
            h: h,
            dx: x,
            dy: y,
            row: row || 0,
            col: col || 0,
            scale: scale || 1
        };
    }
}