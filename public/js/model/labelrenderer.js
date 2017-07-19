const defaultFont = '24px serif'; // TODO: load from conf
const defaultFontColor = 'white'; // TODO: load from conf

const horizontalAlignment = {     // TODO: implement later
    center: 'center', left: 'left', right: 'right'
};

function LabelRenderer() {
    this.labels = new Map();

    this.currentid = -1;
    this.labelid = () => this.currentid += 1;

    this.labelNode = document.getElementById('temp-container');
}

LabelRenderer.prototype.render = function (globalctx) {
    for (const [id, active] of this.labels) {
        if (active.label.transformState.changed) {
            active.label.calcTransform(globalctx, active.pos.x, active.pos.y);
            active.label.render();
        }
    }
};

LabelRenderer.prototype.setTransform = function (labelid, x, y) {
    if (this.labels.has(labelid)) {
        const l = this.labels.get(labelid);

        l.pos.x = x;
        l.pos.y = y;
        l.label.transformState.changed = true;
        l.label.transformState.rendered = false;

        this.labels.set(labelid, l);

        return true;
    }
    return false;
}

LabelRenderer.prototype.add = function (text, fontstyle, fontsize, color) {
    const id = this.labelid();

    this.labels.set(id, {
        label: new Label(text, fontstyle, fontsize, color, id),
        pos: {
            x: 0, y: 0
        }
    });

    return id;
};

LabelRenderer.prototype.remove = function (globalctx, id) {
    const label = this.labels.get(id).label;

    if (label) {
        globalctx.clearRect(label.transform.global.x, label.transform.global.y, label.canvas.width, label.canvas.height);
        const node = document.getElementById(label.id);
        if (node) {
            node.parentNode.removeChild(node);
            this.labels.delete(id);

            return true;
        }
    }

    return false;
};