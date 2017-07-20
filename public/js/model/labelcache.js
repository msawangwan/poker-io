class LabelCache {
    constructor() {
        this.store = new Map();
    };

    addNewLabel(fontstyle, fontsize, fontcolor) {
        const label = new Label(fontstyle, fontsize, fontcolor);

        this.store.set(label.id, {
            label: label, text: '...'
        });

        return label.id;
    };

    setLabelText(labelid, text) {
        this.store.get(labelid).text = text;
        this.store.get(labelid).label.canvasChanged = true;
    };

    updateLabelTransform(labelid, ctx, x, y) {
        const label = this.store.get(labelid).label;
        ctx.clearRect(label.transform.global.x, label.transform.global.y, label.canvas.width, label.canvas.height);

        label.canvasChanged = true;
        label.updateTransform(ctx, x, y);
    };

    render(labelid, ctx) {
        const l = this.store.get(labelid);
        l.label.render(ctx, l.text);
    }
}