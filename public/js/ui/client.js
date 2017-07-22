const flags = {
    DEBUG: true,
    NOCONN: true
};

const resizeCanvases = (parentCanvasId, canvasEleGroup) => {
    const parentEle = document.getElementById(parentCanvasId);

    const w = parentEle.offsetWidth;
    const h = parentEle.offsetHeight;

    for (const c of canvasEleGroup) {
        c.width = w;
        c.height = h;
    }
};

const tickrate = 1000 / 2;
const startupt = 1500;
const canvasLayerIds = ['static-canvas', 'dynamic-canvas', 'label-canvas'];
const containerCanvasId = 'container-canvas';

const testdata = {
    gamedata: {
        gameid: 0,
        seatIndex: 3
    },
    cards: {
        a: { value: 5, suite: 0 },
        b: { value: 8, suite: 2 }
    }
};

{
// const layer = {
//     table: {
//         id: 'static-canvas',
//         canvas: null,
//         ctx: null
//     },
//     cards: {
//         id: 'dynamic-canvas',
//         canvas: null,
//         ctx: null
//     },
//     label: {
//         id: 'label-canvas',
//         canvas: null,
//         ctx: null
//     }
// };
}

const current = {
    player: null, table: null
}

$(document).ready(() => {
    const socket = io.connect(window.location.origin, {
        'reconnection': false
    });

    const staticCanvas = document.getElementById(canvasLayerIds[0]);
    const dynamicCanvas = document.getElementById(canvasLayerIds[1]);
    const labelCanvas = document.getElementById(canvasLayerIds[2]);

    const canvasGroup = [staticCanvas, dynamicCanvas, labelCanvas];

    resizeCanvases(containerCanvasId, canvasGroup);

    const staticCtx = staticCanvas.getContext('2d');
    const dynamicCtx = dynamicCanvas.getContext('2d');
    const labelCtx = labelCanvas.getContext('2d');

    const $containerbetting = $('#container-betting');
    const $containerturnactions = $('#container-turn-actions');
    const $bettextfield = $('#bet-amount-text-field');
    const $betrangeslider = $('#bet-range-slider');
    const $betsubmitbutton = $('#bet-submit-bet-btn');

    $betrangeslider.on('change', () => {
        const slidervalue = $betrangeslider.val();
        $bettextfield.val(slidervalue);
    });

    const onconnect = (data) => {
        console.log('client connected');

        current.table = new Table(9, staticCanvas, labelCanvas);

        const guestname = Player.assignGuestName();
        const id = socket.id;
        const balance = 500;

        let seatindex = 0;

        while (seatindex < current.table.maxseats) {
            current.table.emptySeat(seatindex);
            seatindex += 1;
        }

        current.table.redraw();

        socket.emit('joined-table', { name: guestname, balance: balance });
    };

    const onsit = (data) => {
        const seatedPlayer = current.table.sit(
            data.seatedPlayer.seatIndex,
            data.seatedPlayer.name,
            socket.id,
            data.seatedPlayer.balance,
            dynamicCanvas
        );

        if (seatedPlayer) {
            current.player = seatedPlayer;
            socket.emit('player-ready', { player: seatedPlayer });

            if (flags.DEBUG) {
                Promise.resolve().then(() => {
                    console.log('debug: deal fake hand on sit');
                    oncardsdealt({ cards: testdata.cards });
                });
            }
        }
    };

    const onsitother = (data) => {
        const gameState = data.tableGameState;
        const occupiedSeats = data.occupiedSeats;

        if (occupiedSeats.length !== current.table.seatCount(false)) {
            
        }

        if (current.table.seatCount(false) === data.seatCount) {
            console.log('seat count has not changed');
        } else {
            console.log('server seat count doesnt match, updating');

            {
                console.log('=== === ===');
                console.log('all players (not including self):');
                console.log(data.seatedPlayers);
                console.log('=== === ===');
            }

            for (const other of data.seatedPlayers) {
                const pos = other[0];
                const player = other[1];

                if (player.id === socket.id) {
                    console.log('skipping self');
                    continue;
                }
                
                {
                    console.log('=== === ===');
                    console.log('creating new player:');
                    console.log(`position: ${pos}`);
                    console.log(`name: ${player.name}`);
                    console.log(`id: ${player.id}`);
                    console.log(`balance: ${player.balance}`);
                    console.log('=== === ===');
                }

                const seatedOther = current.table.sit(
                    pos,
                    player.name,
                    player.id,
                    player.balance,
                    dynamicCanvas
                );
            }
        }

        current.table.redraw();
    };

    const oncardsdealt = (data) => {
        current.player.gotHand(data.cards.a, data.cards.b);
    };

    socket.on('connect', onconnect);
    socket.on('player-seated', onsit);
    socket.on('a-player-was-seated', onsitother);
    socket.on('cards-dealt', oncardsdealt);

    let renderLoop = null;
    
    if (flags.DEBUG) {
        onconnect();
        onsitother({
            seatedPlayers: {},
            seatCount: 2
        });
    }

    setTimeout(() => { // start
        console.log('debug: entered start ...');
        setTimeout(() => { // update
            console.log('debug: ... started update ...');
            renderLoop = setInterval(() => {
                current.table.render();
            }, tickrate, current.table, staticCanvas);
            console.log('debug: ... updating running ...');
        }, startupt);
        console.log('debug: ... exited start.');
    }, startupt);

    $(window).on('resize', () => {
        resizeCanvases(containerCanvasId, canvasGroup);
        current.table.redraw();
    });
});