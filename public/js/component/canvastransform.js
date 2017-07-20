class CanvasTransform {
    constructor() {
        this.position = {
            local: {
                x: 0,
                y: 0
            },
            global: {
                x: 0,
                y: 0
            }
        };

        this.width = 0;
        this.height = 0;
        this.radius = 0;
        this.offset = 0;

        this.transformUpdated = true;
    };

    get localPos() {
        return [this.position.local.x, this.position.local.y];
    };

    set localPos(x, y) {
        this.position.local.x = x;
        this.position.local.y = y;
    };

    get globalPos() {
        return [this.position.global.x, this.position.global.y];
    };

    set globalPos(x, y) {
        this.position.global.x = x;
        this.position.global.y = y;
    };

    get rect() {
        return [this.width, this.height, this.radius, this.offset];
    };

    set rect(w, h, r, off) {
        this.width = w;
        this.height = h;
        this.radius = r;
        this.offset = off;
    };
}