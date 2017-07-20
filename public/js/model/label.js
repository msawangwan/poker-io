$(document).ready(() => {
    const DOMlabels = document.getElementById('temp-container');
});

const formatfontstr = (f, fs) => (f && fs) ? `${fs}px ${f}` : defaultFont;

let nextId = -1;

class Label {
    constructor(text, fontstyle, fontsize, color) {
        this.id = nextId += 1;

        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('id', this.id);
        this.canvas.style['background-color'] = 'rgba(255,0,0,0)';

        this.text = text;

        this.font = {
            style: fontstyle,
            size: fontsize,
            color: color
        };

        this.transform = {
            local: {
                x: 0, y: 0
            },
            global: {
                x: 0, y: 0
            },
            textwidth: 0,
            w: 0,
            h: 0
        };

        this.canvasChanged = true;
        this.drawOnNextTick = true;
    };

    updateTransform(globalctx, globalx, globaly) {
        if (this.canvasChanged) {
            const t = this.transform;

            t.textwidth = globalctx.measureText(this.text).width;

            t.w = Math.floor(t.textwidth);
            t.h = Math.floor(this.font.size * 2);

            t.local.x = this.canvas.width * 0.5 - t.textwidth + this.font.size;
            t.local.y = this.canvas.height - this.canvas.height * 0.5;

            t.global.x = globalx - this.canvas.width * 0.5;
            t.global.y = globaly - this.canvas.height * 0.5;

            this.transform = t;

            this.drawOnNextTick = true;
        } else {
            this.drawOnNextTick = false;
        }

        this.canvasChanged = false;
    };

    render(globalctx) {
        if (this.drawOnNextTick) {
            const localctx = this.canvas.getContext('2d');

            localctx.font = formatfontstr(this.font.style, this.font.size);
            localctx.fillStyle = this.font.color;
            localctx.fillText(this.text, this.transform.local.x, this.transform.local.y);

            globalctx.drawImage(this.canvas, this.transform.global.x, this.transform.global.y);
        }

        this.drawOnNextTick = false;
    };
}