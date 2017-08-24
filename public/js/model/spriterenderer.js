class SpriteRenderer {
    constructor(canvas, src) {
        this.buf = document.createElement('canvas');

        this.canvas = canvas;
        this.src = src;

        this.img = null;
        this.imgdata = null;
    }

    render(transform, tint) {
        const { dx, dy, row, col, w, h, scale } = transform;
        const img = new Image();

        img.onload = () => {
            let buftint = null;

            this.buf.width = w;
            this.buf.height = h;

            const bufctx = this.buf.getContext('2d');

            // tinting algorithm adapted from:
            // https://stackoverflow.com/questions/2688961/how-do-i-tint-an-image-with-html5-canvas

            if (tint) {
                buftint = document.createElement('canvas');

                buftint.width = w;
                buftint.height = h;

                const buftintctx = buftint.getContext('2d');

                buftintctx.fillStyle = tint.color;
                buftintctx.fillRect(0, 0, w, h);

                buftintctx.globalCompositeOperation = "destination-atop";
                buftintctx.drawImage(
                    img,
                    row * w,
                    col * h,
                    w,
                    h,
                    0,
                    0,
                    w * scale,
                    h * scale
                );
            }

            bufctx.drawImage(
                img,
                row * w,
                col * h,
                w,
                h,
                0,
                0,
                w * scale,
                h * scale
            );

            const canvasctx = this.canvas.getContext('2d');

            canvasctx.drawImage(this.buf, dx, dy);

            if (buftint) {
                canvasctx.globalAlpha = 0.5;
                canvasctx.drawImage(buftint, dx, dy);
            }
        };

        img.src = this.src;

        this.img = img;
    }
}