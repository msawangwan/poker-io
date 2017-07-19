$(document).ready(() => {
    const DOMlabels = document.getElementById('temp-container');
});

const formatfontstr = (f, fs) => (f && fs) ? `${fs}px ${f}` : defaultFont;

function Label(text, font, fontsize, color, id) {
    this.id = id;

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', this.id);
    this.canvas.style['background-color'] = 'rgba(255,0,0,0)';

    this.text = text;

    this.font = {
        style: font,
        size: fontsize,
        color: color
    };

    this.parentCtx = undefined;

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
}

Label.prototype.updateTransform = function (globalctx, globalx, globaly) {
    if (this.canvasChanged) {
        const t = this.transform;
    
        t.textwidth = globalctx.measureText(this.text).width;
    
        t.w = Math.floor(t.textwidth * 10);
        t.h = Math.floor(this.font.size * 2);
    
        t.local.x = this.canvas.width * 0.5 - t.textwidth; // or: t.textwidth / 2
        t.local.y = this.canvas.height - this.canvas.height / 2; // or: just this.canvas.height / 2
    
        t.global.x = globalx - this.canvas.width / 2;
        t.global.y = globaly - this.canvas.height / 2;
    
        this.transform = t;
        this.parentCtx = globalctx;
        this.drawOnNextTick = true;
    } else {
        this.drawOnNextTick = false;
    }

    this.canvasChanged = false;
};

Label.prototype.render = function () {
    if (this.drawOnNextTick) {
        const localctx = this.canvas.getContext('2d');
    
        localctx.font = formatfontstr(this.font.style, this.font.size);
        localctx.fillStyle = this.font.color;
        localctx.fillText(this.text, this.transform.local.x, this.transform.local.y);
    
        this.parentCtx.drawImage(this.canvas, this.transform.global.x, this.transform.global.y);
    }
    
    this.drawOnNextTick = false;
};