// const resizeCanvases = (parentCanvasId, canvasEleGroup) => {
//     const parentEle = document.getElementById(parentCanvasId);

//     const w = parentEle.offsetWidth;
//     const h = parentEle.offsetHeight;

//     for (const c of canvasEleGroup) {
//         c.width = w;
//         c.height = h;
//     }
// };

// const canvasLayerIds = ['static-canvas', 'dynamic-canvas', 'label-canvas'];
// const containerCanvasId = 'container-canvas';

// const tickrate = 1000 / 2;
// const startupt = 800;

// const current = {
//     player: null, table: null
// };

// $(document).ready(() => {
//     const staticCanvas = document.getElementById(canvasLayerIds[0]);
//     const dynamicCanvas = document.getElementById(canvasLayerIds[1]);
//     const labelCanvas = document.getElementById(canvasLayerIds[2]);

//     const staticCtx = staticCanvas.getContext('2d');
//     const dynamicCtx = dynamicCanvas.getContext('2d');
//     const labelCtx = labelCanvas.getContext('2d');

//     const canvasGroup = [staticCanvas, dynamicCanvas, labelCanvas];

//     const socket = io.connect(window.location.origin, {
//         'reconnection': false
//     });

//     resizeCanvases(containerCanvasId, canvasGroup);

//     {
//         socket.on('connect', (data) => {
//             current.table = new Table(9, staticCanvas, labelCanvas);

//             current.table.init();
//             current.table.redraw();
//         });

//         socket.on('assigned-table', (data) => {
//             current.player = new Player(data.guestname, socket.id, 0, dynamicCanvas);

//             current.table.assignedId = data.table.id;
//             current.table.centerLabelText = 'waiting for players ...';

//             current.table.seatPlayer(data.table.assignedSeat, current.player);
//             current.table.seatOpponents(data.table.seatingState, socket.id);

//             resizeCanvases(containerCanvasId, canvasGroup);
//         });

//         socket.on('a-player-has-joined', (data) => {
//             current.table.seatOpponents(data.table.seatingState, socket.id);

//             resizeCanvases(containerCanvasId, canvasGroup);
//         });

//         socket.on('game-started', (data) => {
//             current.table.game = new Game(data.gameId, current.table.players);

//             socket.emit('get-position', {
//                 tableid: current.table.id,
//                 gameid: current.table.game.id
//             });
//         });

//         socket.on('assign-positions', (data) => {
//             {
//                 console.log('===');
//                 console.log('position data sent');
//                 console.log('===');
//             }

//             current.table.game.assignButton(data.button);

//             console.log(data);
//         });
//     }

//     let renderLoop = null;

//     {
//         setTimeout(() => { // start
//             console.log(`===`);
//             console.log('entered start ...');
//             setTimeout(() => { // update
//                 console.log(`===`);
//                 console.log('... started update ...');
//                 renderLoop = setInterval(() => {
//                     current.table.render();
//                 }, tickrate, current.table, staticCanvas);
//                 console.log('... updating running ...');
//                 console.log(`===`);
//             }, startupt);
//             console.log('... exited start.');
//             console.log(`===`);
//         }, startupt);
//     }

//     $(window).on('resize', () => {
//         resizeCanvases(containerCanvasId, canvasGroup);
//         current.table.redraw();
//     });
// });