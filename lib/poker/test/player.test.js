const Player = require('../player');

const testids = [
    [0, { id: 12356666, name: 'walkder' }],
    [1, { id: 1234444, name: 'dfff' }],
    [2, { id: 12332223, name: 'sdaf' }],
    [3, { id: 1233323, name: 'fs' }],
];

console.log(
    testids.reduce((r, p) => r.concat(p[1].id), [])
);