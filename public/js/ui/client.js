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

const table = {
    state: null
};

const player = {
    state: null
};

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

        table.state = new Table(9, staticCanvas, labelCanvas);

        player.state = new Player(
            Player.assignGuestName(),
            socket ? socket.id : -1,
            500,
            dynamicCanvas
        );

        let seatindex = 0;

        while (seatindex < table.state.maxseats) {
            table.state.emptySeat(seatindex);
            seatindex += 1;
        }

        table.state.redraw();

        socket.emit('joined-table', { name: player.state.name, balance: player.state.balance });
    };

    const onsit = (data) => {
        player.state.gameid = data.gameId;

        const seated = table.state.sit(data.seatIndex, player.state);

        if (seated) {
            player.state.takeSeatAt(table.state, data.seatIndex);
            table.state.setCenterLabelText('waiting for players ...');
        }

        socket.emit('player-ready', { seated: seated });

        if (flags.DEBUG) {
            Promise.resolve().then(() => {
                console.log('debug: deal fake hand on sit');
                oncardsdealt({ cards: testdata.cards });
            });
        }
    };

    const onsitother = (data) => {
        if (table.state.seatCount(false) === data.seatCount) {
            console.log('seat count has not changed');
        } else {
            console.log('server seat count doesnt match, updating');

            for (const other of data.seatedPlayers) {
                if (other.id === socket.id) {
                    console.log('skipping self');
                    continue;
                }

                const p = new Player(
                    other[1].name,
                    other[1].id,
                    other[1].balance,
                    dynamicCanvas
                );

                const seated = table.state.sit(other[0], p);

                if (seated) {
                    console.log(`seated player ${p.name}`);
                    p.takeSeatAt(table.state, other[0]);
                }
            }

            console.log(data.seatedPlayers);
        }

        table.state.redraw();
    };

    const oncardsdealt = (data) => {
        player.state.gotHand(data.cards.a, data.cards.b);
    };

    socket.on('connect', onconnect);
    socket.on('player-seated', onsit);
    socket.on('a-player-was-seated', onsitother);
    socket.on('cards-dealt', oncardsdealt);

    let renderLoop = null;

    setTimeout(() => { // start
        console.log('debug: entered start ...');
        setTimeout(() => { // update
            console.log('debug: ... started update ...');
            setTimeout(() => { // debug
                // console.log('debug ... starting debug check...');

                // flags.NOCONN = !socket.connected;

                // if (flags.DEBUG && flags.NOCONN) {
                //     console.log('player sits at table');
                //     onsit(testdata.gamedata);

                //     console.log('call the oncardsdealt callback');
                //     oncardsdealt({ cards: testdata.cards });
                // }

                // console.log('debug ... exit debug check ...');
            }, startupt);
            renderLoop = setInterval(() => {
                table.state.render();
            }, tickrate, table.state, staticCanvas);
            console.log('debug: ... updating running ...');
        }, startupt);
        console.log('debug: ... exited start ...');
    }, startupt);

    $(window).on('resize', () => {
        resizeCanvases(containerCanvasId, canvasGroup);
        table.state.redraw();
    });
});