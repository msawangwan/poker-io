class Sprite {
    constructor(parentcanvas, src) {
        this.parentcanvas = parentcanvas;
        this.src = src;

        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;

        this.row = 0;
        this.col = 0;

        this.scalex = 1;
        this.scaley = 1;

        this.img = null;
        this.imgdata = null;
    }

    render(x, y, row, col, w, h) {
        const img = new Image();

        img.onload = () => {
            const ctx = this.parentcanvas.getContext('2d');

            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;

            this.row = row;
            this.col = col;

            ctx.drawImage(img, row * w, col * h, w, h, x, y, w, h);

            this.imgdata = ctx.getImageData(x, y, w, h);
        };

        img.src = this.src;

        this.img = img;
    }

    renderScaled(x, y, row, col, w, h, sx, sy) {
        const img = new Image();

        img.onload = () => {
            const ctx = this.parentcanvas.getContext('2d');

            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;

            this.row = row;
            this.col = col;

            this.scalex = sx;
            this.scaley = sy;

            ctx.drawImage(img, row * w, col * h, w, h, x, y, w * sx, h * sy);

            this.imgdata = ctx.getImageData(x, y, w * sx, h * sy);
        };

        img.src = this.src;

        this.img = img;
    }

    // todo: refactor
    erase(x, y, w, h, sx, sy) {
        const ctx = this.parentcanvas.getContext('2d');
        ctx.clearRect(x, y, w * sx, h * sy);
    }

    // see: 
    // https://stackoverflow.com/questions/29156849/html5-canvas-changing-image-color
    // http://www.playmycode.com/blog/2011/06/realtime-image-tinting-on-html5-canvas/
    tintez() {
        this.parentcanvas.getContext('2d').globalCompositeOperation = 'lighter';
    }

    tint(amount) {
        // const by = -1 * (amount || 30) / 100;
        // const shifted = Sprite.hueShift(this.imgdata, by);

        // this.imgdata = shifted;

        const c = { r: 0, g: 127, b: 200 };

        for (let i = 0; i < this.imgdata.length; i += 4) {
            this.imgdata.data[i] += c.r;
            this.imgdata.data[i + 1] += c.g;
            this.imgdata.data[i + 2] += c.b;
        }

        this.parentcanvas.getContext('2d').putImageData(
            this.imgdata,
            this.x,
            this.y
        );
    }

    static rgba(r, g, b, a) {
        return {
            red: r,
            green: g,
            blue: b,
            alpha: a
        };
    }

    static hsl(h, s, l) {
        return {
            hue: h,
            saturation: s,
            lightness: l
        };
    }

    static hueShift(imgdata, shift) {
        const original = imgdata;
        const shifted = imgdata;
        const data = original.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i + 0];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (r === 0 && g === 0 && b === 0) { // skip empty pixel
                continue;
            }

            const rgba = Sprite.rgba(r, g, b, a);
            const hsl = Sprite.rgbaToHsl(rgba);
            const hue = hsl.hue * 360;

            const newRgba = Sprite.hslToRgba(
                hsl.hue + shift,
                hsl.saturation,
                hsl.lightness
            );

            shifted.data[i + 0] = newRgba.red;
            shifted.data[i + 1] = newRgba.green;
            shifted.data[i + 2] = newRgba.blue;
            shifted.data[i + 3] = 255;
            // if (hue < 30 || hue > 300) { // change red-ish pixels to the new color
            // }
        }

        return shifted;
    }

    static rgbaToHsl(rgba) {
        const r = rgba.red / 255;
        const g = rgba.green / 255;
        const b = rgba.blue / 255;
        const a = rgba.alpha / 255;

        const min = Math.min(r, g, b);
        const max = Math.max(r, g, b);
        const mid = (max + min) / 2;

        const hsl = Sprite.hsl(mid, mid, mid);

        if (max === min) { // achromatic
            hsl.hue = hsl.saturation = 0
        } else {
            const d = max - min;

            hsl.saturation = hsl.lightness > 0.5 ?
                d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    hsl.hue = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    hsl.hue = (b - r) / d + 2;
                    break;
                case b:
                    hsl.hue = (r - g) / d + 4;
                    break;
            }
            hsl.hue /= 6;
        }

        return hsl;
    }

    static hslToRgba(hsl) {
        const h = hsl.hue;
        const s = hsl.saturation;
        const l = hsl.lightness;

        if (s === 0) { // achromatic
            const chromatic = Math.round(l) * 255;
            return Sprite.rgba(chromatic, chromatic, chromatic, 255);
        }

        const hueToRgb = (p, q, t) => {
            if (t < 0) {
                t += 1;
            }

            if (t > 1) {
                t -= 1;
            }

            if (t < (1 / 6)) {
                return p + (q - p) * 6 * t;
            }

            if (t < (1 / 2)) {
                return q;
            }

            if (t < (2 / 3)) {
                return p + (q - p) * (2 / 3 - t) * 6;
            }

            return p;
        }

        const q = l < 0.5 ? l * (1 + s) : 1 + s - 1 * s;
        const p = 2 * l - q;

        return Sprite.rgba(
            hueToRgb(p, q, h + 1 / 3) * 255,
            hueToRgb(p, q, h) * 255,
            hueToRgb(p, q, h - 1 / 3) * 255
        );
    }

    static generateRgbkPixelData(img) {
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
    }

    static generateTintFromPixelData(img, rgbks, r, g, b) {
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
    }

    static drawTinted(img, canvas, onload) {
        img.onload = () => {
            const rgbks = Sprite.generateRgbkPixelData(img);
            const tinted = Sprite.generateTintFromPixelData(img, rgbks, 200, 50, 100);
            const cx = document.getElementById(canvas).getContext('2d');
            cx.fillStyle = 'black';
            cx.fillRect(0, 0, 100, 100);
            cx.drawImage(tinted, 50, 50);
        }
    }
}