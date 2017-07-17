// this is a snippet from stack overflow
// https://stackoverflow.com/questions/3543687/how-do-i-clear-text-from-the-canvas-element

// this.textRendererDraw = function () {
//     var metrics = this.ctx.measureText(this.lastValue),
//         rect = {
//             x: 0,
//             y: this.y - this.textSize / 2,
//             width: metrics.width,
//             height: this.textSize,
//         };

//     switch (this.hAlign) {
//         case 'center':
//             rect.x = this.x - metrics.width / 2;
//             break;
//         case 'left':
//             rect.x = this.x;
//             break;
//         case 'right':
//             rect.x = this.x - metrics.width;
//             break;
//     }

//     this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

//     this.ctx.font = this.weight + ' ' + this.textSize + ' ' + this.font;
//     this.ctx.textAlign = this.hAlign;
//     this.ctx.fillText(this.value, this.x, this.y);
//     this.lastValue = this.value;
// };