class Renderer {
    constructor() {
        this.buffer = new Map();
    
        this.drawOnNextUpdate = false;
    };
    
    enqueue(id, renderop) {
        this.buffer.set(id, renderop);
        this.drawOnNextUpdate = true;
    };
    
    process() {
        if (this.drawOnNextUpdate) {
            this.drawOnNextUpdate = false;
            
            for (const [id,op] of this.buffer) {
                op();
            }
            
            this.buffer = new Map();
        }
    };
}