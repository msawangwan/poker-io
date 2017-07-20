const formatfontstr = (f, fs) => `${fs}px ${f}`;

let nextId = -1;

class Label {
    constructor(font, fontsize, fontcolor) {
        this.id = nextId + 1;

        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('id', `label-canvas-${this.id}`);

        this.ctx = this.canvas.getContext('2d');

        this.style = {
            font: font,
            fontsize: fontsize,
            fontcolor: fontcolor,
            textalign: 'center',
            textbaseline: 'middle'
        };
    };

    draw(text, textcanvas, x, y) {
        const ctx = this.canvas.getContext('2d');

        ctx.font = formatfontstr(this.style.font, this.style.fontsize);
        ctx.fillStyle = this.style.fontcolor;
        ctx.textAlign = this.style.textalign;
        ctx.textBaseline = this.style.textbaseline;
        ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

        this.canvas.width = Label.powOfTwo(ctx.measureText(text).width);
        this.canvas.height = Label.powOfTwo(this.style.fontsize * 2);

        ctx.font = formatfontstr(this.style.font, this.style.fontsize);
        ctx.fillStyle = this.style.fontcolor;
        ctx.textAlign = this.style.textalign;
        ctx.textBaseline = this.style.textbaseline;
        ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);

        textcanvas.getContext('2d').drawImage(this.canvas, x - this.canvas.width / 2, y - this.canvas.height / 2);
    };

    static powOfTwo(v, power) {
        let p = power || 1;
        while (p < v) {
            p *= 2;
        }
        return p;
    };
}