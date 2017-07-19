function LabelRenderer() {
    this.labels = new Map();

    this.currentid = -1;
    this.labelid = () => this.currentid += 1;

    this.labelNode = document.getElementById('temp-container');
}

LabelRenderer.prototype.render = function () {
    for (const [id, active] of this.labels) {
        if (active.label.drawOnNextTick) {
            active.label.render();
        }
    }
};

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