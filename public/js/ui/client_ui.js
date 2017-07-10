const log = (...s) => console.log(`${s.map(m => `${m}\n`).join('')}`);

const div = content => $('<div></div>').text(content);

$(document).ready(() => {
    const socket = io.connect(window.location.origin);

    socket.on('update-ui-display-table', state => {
        for (const s of state.tableState) {
            if (s === 'empty seat') {
                // seat is empty
            } else {
                // draw
            }
        }
    });
});
