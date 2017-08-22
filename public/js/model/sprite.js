class Sprite {
    constructor(parentcanvas, src) {
        this.parentcanvas = parentcanvas;
        this.src = src;
        
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        
        this.row = 0;
        this.col = 0;
    }

    render(x, y, row, col, w, h) {
        const img = new Image();

        img.onload = () => {
            const ctx = this.parentcanvas.getContext('2d');
            
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            
            this.row = row;
            this.col = col;
            
            ctx.drawImage(img, row * w, col * h, w, h, x, y, w, h);
        };

        img.src = this.src;
    }

    renderScaled(x, y, row, col, w, h, sx, sy) {
        const img = new Image();

        img.onload = () => {
            const ctx = this.parentcanvas.getContext('2d');
            ctx.drawImage(img, row * w, col * h, w, h, x, y, w * sx, h * sy);
        };

        img.src = this.src;
    }

    erase(x, y, w, h, sx, sy) {
        const ctx = this.parentcanvas.getContext('2d');
        ctx.clearRect(x, y, w * sx, h * sy);
    }
    
    // see: https://stackoverflow.com/questions/29156849/html5-canvas-changing-image-color
    
    tint() {
        
    }
}