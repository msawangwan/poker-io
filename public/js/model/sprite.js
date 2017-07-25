class Sprite {
    constructor(parentcanvas, src, row, col, w, h) {
        this.parentcanvas = parentcanvas;
        this.src =src;
        
        this.width = w;
        this.height = h;
        
        this.row = {
            offset: row * w,
            index: row
        };
        
        this.col = {
            offset: col * h,
            index: col
        };
    };
    
    draw(dx, dy, sx, sy) {
        const img = new Image();
        
        img.onload = () => {
            this.parentcanvas.getContext('2d').drawImage(
                img,
                this.row.offset,
                this.col.offset,
                this.width,
                this.height,
                dx,
                dy,
                this.width * sx,
                this.height * sy
            );
        };
        
        img.src = this.src;
    };
}

// function Sprite(src, row, col, w, h) {
//     this.src = src;

//     this.width = w;
//     this.height = h;

//     this.row = {
//         offset: row * w, index: row
//     };

//     this.col = {
//         offset: col * h, index: col
//     };

//     this.cacheKey = `${this.row.index}::${this.col.index}`;
// };

// Sprite.prototype.draw = function (ctx, img, dx, dy, sx, sy) {
//     img.onload = () => {
//         ctx.drawImage(
//             img,
//             this.row.offset,
//             this.col.offset,
//             this.width,
//             this.height,
//             dx,
//             dy,
//             this.width * sx,
//             this.height * sy
//         );
//     };

//     img.src = this.src;
// };