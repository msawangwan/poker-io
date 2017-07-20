class LabelCache {
    constructor() {
        this.store = new Map();
    };

    cache(labelid, label) {
        this.store.set(labelid, label);
    };

    purge(labelid, parentctx) {
        const label = this.store.get(labelid);
        if (label) {
            parentctx.clearRect(label.transform.global.x, label.transform.global.y, label.canvas.width, label.canvas.height);
            const node = document.getElementById(label.id);
            if (node) {
                node.parentNode.removeChild(node);
                this.store.delete(labelid);

                return true;
            }
        }

        return false;
    };
}