const defaultFont = '24px serif'; // TODO: load from conf
const defaultFontColor = 'white'; // TODO: load from conf

const horizontalAlignment = {
    center: 'center', left: 'left', right: 'right'
};

const formatfontstr = (f, fs) => (f && fs) ? `${fs}px ${f}` : defaultFont;

function LabelRenderer() {
    this.labels = new Map();

    this.currentid = -1;
    this.labelid = () => this.currentid += 1;

    this.labelNode = document.getElementById('temp-container');
}

LabelRenderer.prototype.render = function (globalctx) {
    for (const [id, label] of this.labels) {
        this.renderTo(globalctx, label.pos.x, label.pos.y, id);
    }
};

LabelRenderer.prototype.addNew = function (text, posx, posy, halignment, font, fontsize, color) {
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
            color: color || defaultFontColor,
            hAlign: halignment
        }
    });

    this.labelNode.appendChild(c);

    return id;
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

LabelRenderer.prototype.renderTo = function (globalctx, x, y, id) {
    const label = this.labels.get(id);

    if (label) {
        const size = globalctx.measureText(label.text.copy);

        label.canvas.width = Math.floor(size.width * 10);
        label.canvas.height = Math.floor(label.text.fontsize) * 2;

        let rectx = 0;
        let recty = label.canvas.height - label.canvas.height / 2;

        switch (label.text.hAlign) {
            case 'left':
                rectx = 0;
                break;
            case 'right':
                rectx = label.canvas.width / 2 - size.width;
                break;
            default: // defaults to 'center'
                rectx = label.canvas.width / 2;
                break;
        }

        const labelctx = label.canvas.getContext('2d');

        labelctx.font = formatfontstr(label.text.font, label.text.fontsize);
        labelctx.fillStyle = label.text.color;
        labelctx.fillText(label.text.copy, rectx, recty);

        globalctx.drawImage(label.canvas, x, y);

        label.pos.x = x;
        label.pos.y = y;

        return true;
    }

    return false;
};