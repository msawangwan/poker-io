const Deck = require('../deck');
const House = require('../house');
const Board = require('../board');

const house = new House(new Deck());
const board = new Board();

const playerIds = ['jimmy415', 'frank707', 'sierra610', 'lacy510'];

house.shuffleDeck(10);

const hands = house.deal('hand', playerIds);

console.log(hands);

for (const h of hands) {
    console.log('card1:', h[1].a);
    console.log('card2:', h[1].b);
}

const flop = house.deal('flop');

console.log('flop');

board.add('a', flop[0]);
board.add('b', flop[1]);
board.add('c', flop[2]);

console.log(board.communityCards);

const turn = house.deal('turn');

console.log('turn');

board.add('d', turn[0]);

console.log(board.communityCards);

const river = house.deal('river');

console.log('river');

board.add('e', river[0]);

const numCardsDrawn = (playerIds.length * 2) + flop.length + turn.length + river.length + 3;
const numCardsExpectedRemaining = 52 - numCardsDrawn;
const numCardsActualRemaining = house.deck.cardCount;

console.log(board.communityCards);

console.log('number of cards drawn ==', numCardsDrawn);
console.log('number of cards left in deck', numCardsActualRemaining);

console.assert(
    numCardsExpectedRemaining === numCardsActualRemaining,
    `num cards remaining expected [${numCardsExpectedRemaining}] doesn't match num cards actual remaining [${numCardsActualRemaining}]`
);