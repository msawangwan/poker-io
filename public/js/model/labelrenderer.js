function LabelRenderer() {
    this.labels = new Map();

    this.currentid = -1;
    this.labelid = () => this.currentid += 1;

    this.labelNode = document.getElementById('temp-container');
}

LabelRenderer.prototype.render = function (ctx) {
    for (const [id, next] of this.labels) {
        if (next.drawOnNextTick) {
            next.render(ctx);
        }
    }
};

LabelRenderer.prototype.add = function (text, fontstyle, fontsize, color) {
    const id = this.labelid();
    this.labels.set(id, new Label(text, fontstyle, fontsize, color, id));
    return id;
};

LabelRenderer.prototype.remove = function (globalctx, id) {
    const label = this.labels.get(id);

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

LabelRenderer.prototype.update = function (id, ctx, x, y, text) {
    let old = null;

    if (this.labels.has(id)) {
        old = this.labels.get(id);
        this.remove(ctx, id);
    }

    const newid = this.add(text, old.font.style, old.font.size, old.font.color);
    console.log(old);
    console.log(this.labels.get(newid));
    this.labels.get(newid).updateTransform(ctx, x, y);

    return newid;
};