module.exports = {
    generateRgbkPixelData(img) {
        const rgbks = [];

        const w = img.width;
        const h = img.height;

        const scratchCanvas = document.createElement('canvas');

        scratchCanvas.width = w;
        scratchCanvas.height = h;

        const scratchCtx = scratchCanvas.getContext('2d');
        scratchCtx.drawImage(img, 0, 0);

        const pixels = scratchCtx.getImageData(0, 0, w, h).data;

        // create 3 layers in the order: red, green. blue, black
        for (let i = 0; i < 4; i++) {
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;

            const cx = c.getContext('2d');
            cx.drawImage(img, 0, 0);

            const to = cx.getImageData(0, 0, w, h);
            const toData = to.data;

            for (let k = 0; k < pixels.length; k += 4) {
                toData[k] = (i === 0) ? pixels[k] : 0;
                toData[k + 1] = (i === 1) ? pixels[k + 1] : 0;
                toData[k + 2] = (i === 2) ? pixels[k + 2] : 0;
                toData[k + 3] = pixels[k + 3];
            }

            cx.putImageData(to, 0, 0);

            const imgcomposite = new Image();
            imgcomposite.src = c.toDataURL();

            rgbks.push(imgcomposite);
        }

        return rgbks;
    },

    generateTintFromPixelData(img, rgbks, r, g, b) {
        const buf = document.createElement('canvas');
        buf.width = img.width;
        buf.height = img.height;

        const cx = buf.getContext('2d');

        cx.globalAlpha = 1;
        cx.globalCompositeOperation = 'copy';
        cx.drawImage(rgbks[3], 0, 0);

        cx.globalCompositeOperation = 'lighter';

        const tint = (color, index) => {
            if (color > 0) {
                cx.globalAlpha = color / 255;
                cx.drawImage(rgbks[index], 0, 0);
            }
        };

        tint(r, 0);
        tint(g, 1);
        tint(b, 2);

        return buf;
    },

    draw(img, canvas, onload) {
        img.onload = () => {
            const rgbks = this.generateRgbkPixelData(img);
            const tinted = this.generateTintFromPixelData(img, rgbks, 200, 50, 100);
            const cx = document.getElementById(canvas).getContext('2d');
            cx.fillStyle = 'black';
            cx.fillRect(0, 0, 100, 100);
            cx.drawImage(tinted, 50, 50);
        }
    }
}