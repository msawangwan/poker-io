const Hand = require('../hand');

const testHand = [
    { suite: 0, value: 4 },
    { suite: 0, value: 3 }
];

const testBoard = [
    { suite: 2, value: 12 },
    { suite: 3, value: 6 },
    { suite: 0, value: 5 },
    { suite: 0, value: 3 },
    { suite: 0, value: 2 }
];

const h = new Hand();
const b = h.determine(testHand, testBoard);

console.log("best", b);