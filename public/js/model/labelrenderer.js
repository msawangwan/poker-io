const defaultFont = '24px serif'; // TODO: load from conf
const defaultFontColor = 'white'; // TODO: load from conf

const horizontalAlignment = {     // TODO: implement later
    center: 'center', left: 'left', right: 'right'
};

const formatfontstr = (f, fs) => (f && fs) ? `${fs}px ${f}` : defaultFont;

function LabelRenderer() {
    this.labels = new Map();

    this.currentid = -1;
    this.labelid = () => this.currentid += 1;

    this.labelNode = document.getElementById('temp-container');
}

LabelRenderer.prototype.addNew = function (text, posx, posy, font, fontsize, color) {
    const id = `text-label-${this.labelid()}`
    const c = document.createElement('canvas');

    c.setAttribute('id', id);
    c.style['background-color'] = 'rgba(255,0,0,0)';

    this.labels.set(id, {
        id: id,
        canvas: c,
        pos: {
            x: posx,
            y: posy
        },
        text: {
            copy: text,
            font: font,
            fontsize: fontsize,
            color: color || defaultFontColor
        },
        renderState: {
            changed: true,
            rendered: false
        }
    });

    this.labelNode.appendChild(c);

    return id;
};

LabelRenderer.prototype.updatePosition = function (id) {

};

LabelRenderer.prototype.removeExisting = function (globalctx, id) {
    const label = this.labels.get(id);

    if (label) {
        globalctx.clearRect(label.pos.x, label.pos.y, label.canvas.width, label.canvas.height);
        const node = document.getElementById(label.id);
        if (node) {
            node.parentNode.removeChild(node);
            this.labels.delete(id);

            return true;
        }
    }

    return false;
};

LabelRenderer.prototype.render = function (globalctx) {
    for (const [id, label] of this.labels) {
        if (label.renderState.changed) {
            this.renderTo(globalctx, label.pos.x, label.pos.y, id);
        }
    }
};

LabelRenderer.prototype.renderTo = function (globalctx, x, y, id) {
    const label = this.labels.get(id);

    if (label) {
        const size = globalctx.measureText(label.text.copy);

        label.canvas.width = Math.floor(size.width * 10);
        label.canvas.height = Math.floor(label.text.fontsize) * 2;

        const rectx = label.canvas.width * 0.5 - size.width; // or do size.width * 0.5?
        const recty = label.canvas.height - label.canvas.height / 2; // or just label.canvas.height / 2?

        const labelctx = label.canvas.getContext('2d');

        labelctx.font = formatfontstr(label.text.font, label.text.fontsize);
        labelctx.fillStyle = label.text.color;
        labelctx.fillText(label.text.copy, rectx, recty);

        const globalx = x - label.canvas.width / 2;
        const globaly = y - label.canvas.height / 2;

        globalctx.drawImage(label.canvas, globalx, globaly);

        label.pos.x = globalx;
        label.pos.y = globaly;
        label.renderState.changed = false;
        label.renderState.rendered = true;

        return true;
    }

    return false;
};