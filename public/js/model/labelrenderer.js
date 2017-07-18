const defaultFont = '24px serif'; // TODO: load from conf
const defaultFontColor = 'white'; // TODO: load from conf

function LabelRenderer() {
    this.labels = new Map();

    this.currentid = -1;
    this.labelid = () => this.currentid += 1;

    this.labelNode = document.getElementById('temp-container');
}

LabelRenderer.prototype.addNew = function (text, font, fontsize, color) {
    const id = `text-label-${this.labelid()}`
    const c = document.createElement('canvas');

    c.setAttribute('id', id);

    this.labels.set(id, {
        id: id,
        canvas: c,
        pos: {
            x: 0,
            y: 0
        },
        text: text,
        font: `${fontsize}px ${font}` || defaultFont,
        color: color || defaultFontColor
    });

    this.labelNode.appendChild(c);

    return id;
};

LabelRenderer.prototype.removeExisting = function (parentcanvas, id) {
    const label = this.labels.get(id);

    if (label) {
        parentcanvas.getContext('2d').clearRect(label.pos.x, label.pos.y, label.canvas.width, label.canvas.height);
        // label.canvas.getContext('2d').fillRect(0, 0, label.canvas.width, label.canvas.height);

        const node = document.getElementById(label.id);
        if (node) {
            node.parentNode.removeChild(node);

            this.labels.delete(id);

            return true;
        }
    }

    return false;
};

LabelRenderer.prototype.clearLabelText = function (id) {

};

LabelRenderer.prototype.renderTo = function (parentcanvas, x, y, id) {
    const label = this.labels.get(id);

    if (label) {
        const labelctx = label.canvas.getContext('2d');
        const globalctx = parentcanvas.getContext('2d');
        const size = globalctx.measureText(label.text);

        label.canvas.width = 200;
        label.canvas.height = 200;

        labelctx.font = label.font;
        labelctx.fillStyle = label.color;
        labelctx.fillText(label.text, label.canvas.width / 2, label.canvas.height / 2);

        globalctx.drawImage(label.canvas, x, y);

        label.pos.x = x;
        label.pos.y = y;

        return true;
    }

    return false;
};

// this.textRendererDraw = function () {
//     var metrics = this.ctx.measureText(this.lastValue),
//         rect = {
//             x: 0,
//             y: this.y - this.textSize / 2,
//             width: metrics.width,
//             height: this.textSize,
//         };

//     switch (this.hAlign) {
//         case 'center':
//             rect.x = this.x - metrics.width / 2;
//             break;
//         case 'left':
//             rect.x = this.x;
//             break;
//         case 'right':
//             rect.x = this.x - metrics.width;
//             break;
//     }

//     this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

//     this.ctx.font = this.weight + ' ' + this.textSize + ' ' + this.font;
//     this.ctx.textAlign = this.hAlign;
//     this.ctx.fillText(this.value, this.x, this.y);
//     this.lastValue = this.value;
// };