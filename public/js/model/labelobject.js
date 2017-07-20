const formatfontstr = (f, fs) => `${fs}px ${f}`;

let nextId = -1;

class LabelObject {
    constructor(canvas, fontstyle, fontsize, color, text, x, y) {
        this.id = nextId + 1;

        this.canvas = canvas;

        this.font = {
            style: fontstyle || 'serif',
            size: fontsize || 12,
            color: color || 'black'
        };

        this.width = this.canvas.getContext('2d').measureText(text).width;
        this.height = fontsize;
        this.x = x;
        this.y = y;
    };

    draw() {
        const ctx = this.canvas.getContext('2d');

        ctx.clearRect(this.x, this.y, this.width, this.height);

        ctx.font = formatfontstr(this.font.style, this.font.size);
        ctx.fillStyle = this.font.color;
        ctx.fillText(this.text, this.x, this.y);
    };
}