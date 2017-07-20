class LabelCache {
    constructor() {
        this.store = new Map();
    };
    
    cache(labelid, label) {
        this.store.set(labelid, label);
    };
    
    purge(labelid) {
        if (this.store.has(labelid)) {
            this.store.delete(labelid);
        }
    };
}