class LabelRenderer {
    constructor() {
        this.labels = new Map();
    
        // this.currentid = -1;
        // this.labelid = () => this.currentid += 1;
    
        // this.labelNode = document.getElementById('temp-container');
    };
    
    render (ctx) {
        for (const [id, next] of this.labels) {
            if (next.drawOnNextTick) {
                next.render(ctx);
            }
        }
    };
    
    add (text, fontstyle, fontsize, color) {
        const l = new Label(text, fontstyle, fontsize, color, id);
        this.labels.set(l.id, l);
        return l.id;
    };
    
    remove (ctx, id) {
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
    
    update (id, ctx, x, y, text) {
        let old = null;
    
        if (this.labels.has(id)) {
            old = this.labels.get(id);
            this.remove(ctx, id);
        }
    
        const newid = this.add(text, old.font.style, old.font.size, old.font.color);
        this.labels.get(newid).updateTransform(ctx, x, y);
    
        return newid;
    };
}

// function LabelRenderer() {
// }

// LabelRenderer.prototype.render = function (ctx) {
// };

// LabelRenderer.prototype.add = function (text, fontstyle, fontsize, color) {
    // const id = this.labelid();
    // this.labels.set(id, new Label(text, fontstyle, fontsize, color, id));
    // return id;
// };

// LabelRenderer.prototype.remove = function (globalctx, id) {
// };

// LabelRenderer.prototype.update = function (id, ctx, x, y, text) {
// };