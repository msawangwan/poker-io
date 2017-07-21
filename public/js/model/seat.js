// function Seat(position, radius, color) {
//     this.position = position;
//     this.id = `canvas-seat-${position}`;

//     this.seatColor = color;

//     this.vacant = true;
//     this.player = undefined;

//     this.canvas = document.createElement('canvas');
//     this.canvas.setAttribute('id', this.id);

//     this.canvas.width = radius * 2;
//     this.canvas.height = radius * 2;

//     this.transform = {
//         origin: {
//             local: {
//                 x: 0,
//                 y: 0
//             },
//             global: {
//                 x: 0,
//                 y: 0
//             }
//         },
//         w: 0,
//         h: 0,
//         radius: radius
//     };

//     this.canvasChanged = true;
//     this.drawOnNextTick = true;

//     this.labels = {
//         playername: {
//             label: null,
//             text: ' ... '
//         },
//         playerbalance: {
//             label: null,
//             text: ' ... '
//         }
//     };
// }

// Seat.prototype.updateTransform = function (globalx, globaly, tableradius, tableoffset) {
//     if (this.canvasChanged) {
//         const t = this.transform;

//         t.w = this.canvas.width;
//         t.h = this.canvas.height;

//         t.origin.local.x = Math.floor(t.w * 0.5);
//         t.origin.local.y = Math.floor(t.h * 0.5);

//         t.origin.global.x = Math.floor(globalx - t.w / 2);
//         t.origin.global.y = Math.floor(globaly - t.h / 2);

//         this.transform = t;

//         this.drawOnNextTick = true;
//     } else {
//         this.drawOnNextTick = false;
//     }

//     this.canvasChanged = false;
// };

// Seat.prototype.render = function (toParentCanvas) {
//     if (this.drawOnNextTick) {
//         const t = this.transform;

//         this.canvas.width = t.w;
//         this.canvas.height = t.h;

//         const localctx = this.canvas.getContext('2d');

//         localctx.clearRect(0, 0, t.w, t.h);
//         localctx.arc(t.origin.local.x, t.origin.local.y, t.radius, Math.PI * 2, false);
//         localctx.fillStyle = this.seatColor;
//         localctx.fill();

//         toParentCanvas.getContext('2d').drawImage(this.canvas, t.origin.global.x, t.origin.global.y);
//     }

//     this.drawOnNextTick = false;
// };

// Seat.prototype.sit = function () {

// };