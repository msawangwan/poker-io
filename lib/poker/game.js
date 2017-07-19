const Table = require('./table');
const Deck = require('./deck');
const Card = require('./card');
const IdUtil = require('../id-util');
const EventEmitter = require('events');

const ids = new IdUtil();

const gamePhase = {
    none: 'none', pregame: 'pregame', shuffle: 'shuffle', deal: 'deal', flop: 'flop', fourst: '4thSt', river: 'river'
};

const state = {
    none: 'none', pregame: 'pregame', pending: 'pending', postgame: 'postgame'
};

class GameEvent extends EventEmitter { }

class Game {
    constructor() {
        this.id = ids.generateNextId();
        this.status = state.none;

        this.deck = new Deck();
        this.players = new Map();
        this.gameEvent = new GameEvent();

        this.gameEvent.once('game-started', () => {
            console.log('game-started-once: gameid ' + this.id);
            this.deck.shuffle(5);
            this.status = state.pregame;
        });

        this.gameEvent.on('player-joined', (seatpos, playerid) => {
            console.log('player-joined-on: pid: ' + playerid);

            this.players.set(seatpos, playerid);

            switch (this.status) {
                case state.pregame:
                    if (this.players.size > 1) {
                        for (const player of this.players) {
                            console.log('notify game started: ' + player);
                        }

                        this.status = state.pending;
                    }
                    break;
                default:
                    break;
            }
        });

        this.gameEvent.on('player-left', (seatpos, playerid) => {
            if (this.players.size < 2) {
                // end the game
            }
        });
    };
}

module.exports = Game;

// const phase = ([
//     [-1, 'waiting-for-players'],
//     [0, 'new-deck-shuffle'],
//     [1, 'deal-cards'],
//     [2, 'pre-flop-bet'],
//     [3, 'burn'],
//     [4, 'flop'],
//     [5, 'post-flop-bet'],
//     [6, 'burn'],
//     [7, 'fourth-street-card-turn'],
//     [8, 'post-fourth-street-bet'],
//     [9, 'burn'],
//     [10, 'river-card-turn'],
//     [11, 'post-river-bet'],
//     [12, 'showdown'],
//     [13, 'pay-out-winner']
// ]);

// const suites = [0, 1, 2, 3];
// const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// function Game(name, id) {
//     this.name = name;
//     this.id = id;

//     this.table = {
//         seats: new Map()
//     };

//     this.deck = new Map();

//     for (let i = 0; i < 9; i++) {
//         this.table.seats.set(i, {
//             vacant: true,
//             playerid: -1
//         });
//     }

//     this.currentDeal = {
//         id: -1, started: false
//     };

//     this.dealHistory = [{ id: -1, started: true }];
//     this.lastDeal = () => this.dealHistory[this.dealHistory.length - 1];

//     this.deckShuffleIds = new Set();

//     this.vacantSeats = (vacant) => [...this.table.seats].filter(([pos, seat]) => seat.vacant === vacant);
//     this.vacantSeatCount = (vacant) => this.vacantSeats(vacant).length;
//     this.hasEnoughPlayers = () => this.vacantSeatCount(false) > 1;
//     this.noFreeSeats = () => this.vacantSeatCount(false) > 9;

//     this.playerQueue = {
//         readyup: new Set(),
//         onready: [],
//         readyForDeal: new Set()
//     };

//     this.state = -1;

//     this.playerEventHandlers = new Map();

//     this.stateChangeEvent = new GameEvent();
//     this.gameEvent = new GameEvent();
//     this.tableEvent = new GameEvent();
//     this.deckEvent = new GameEvent();
//     this.playerEvent = new GameEvent();
//     this.dealerEvent = new GameEvent();

//     this.gameEvent.once('game-start', (ongamestart) => {
//         if (this.hasEnoughPlayers()) {
//             console.log('game-start-once: the required number of players are seated, start game!');
//         } else {
//             console.log('game-start-once: waiting for enough players to start game ... ');
//         }

//         if (ongamestart) {
//             ongamestart();
//         }
//     });

//     this.gameEvent.once('new-deck', () => {

//     });

//     this.gameEvent.on('player-joined', (playerid, success, err, handler, onjoin) => {
//         if (this.noFreeSeats()) {
//             err('no seats left');
//         } else {
//             const seat = this.vacantSeats(true)[0];

//             this.table.seats.set(seat).vacant = false;
//             this.table.seats.set(seat).player = playerid;

//             const playerhandlers = [handler];

//             this.playerEventHandlers.set(playerid, playerhandlers);

//             success('player joined and seated');
//             onjoin(seat[0]);
//         }
//     });

//     this.gameEvent.on('player-seated', (playerid, onseated) => {
//         if (this.hasEnoughPlayers()) {
//             // deal a new deck
//             this.gameEvent.emit('new-deck')
//         }
//     });

//     this.stateChangeEvent.once('game-start', (current, onchange) => {
//         console.log('game started!');

//         this.enterNextState(current);
//         this.dealHistory = [-1];

//         onchange(this.state);
//     });

//     this.playerEvent.on('player-seated', (addedPlayer, seatIndex, onadd) => {
//         this.table.seats.set(seatIndex, {
//             vacant: false,
//             player: addedPlayer
//         });

//         console.log(`number of players seated: ${this.vacantSeats().length}`);

//         onadd(this.state);
//     });

//     this.playerEvent.on('player-readyup', (playerid, onreadyup) => {
//         if (this.currentDeal.id === this.lastDeal.id) {
//             this.currentDeal = { id: this.lastDeal.id, started: false };
//         }

//         if (!this.playerQueue.readyup.has(playerid)) {
//             console.log('player readyup: ' + playerid);
//             this.playerQueue.readyup.add(playerid);
//             onreadyup(this.currentDeal);
//         }
//     });

//     this.playerEvent.on('player-ready-for-deal', (playerid, dealid, onreadyfordeal) => {
//         if (!this.deckShuffleIds.has(dealid)) { // only the first caller of a given dealid will run this block
//             this.deck = this.createNewDeck();
//             this.deck = this.newDeckShuffle(4);
//             this.deckShuffleIds.add(dealid);
//         }

//         if (!this.playerQueue.readyForDeal.has(playerid)) {
//             this.playerQueue.readyForDeal.add(playerid);
//         }

//         if (this.playerQueue.readyForDeal.size >= this.playerQueue.readyup.size) {
//             this.currentDeal.started = true;
//         }

//         onreadyfordeal();
//     });

//     this.dealt = new Set();

//     this.dealerEvent.on('deal-hole-cards', (playerid, ondeal) => {
//         if (!this.dealt.has(playerid)) {
//             this.dealt.add(playerid);

//             const a = this.drawCard();
//             const b = this.drawCard();

//             console.log(`dealt two cards to: ${playerid}`);
//             console.log(a.formatted());
//             console.log(b.formatted());

//             const hand = [a, b, { af: a.formatted(), bf: b.formatted() }];

//             if (this.state !== 4) {
//                 this.state = 4;
//             }

//             ondeal(hand, this.state);
//         }
//     });

//     this.gameEvent.emit('game-start', () => {
//         console.log('game-started: a game was created');
//     });
// }

// Game.prototype.enterNextState = function (current) {
//     if (this.state !== current) {
//         console.log(`err: mismatched states [actual] ${this.state} [sent] ${current}`)
//         return false;
//     }

//     // this.state = stateTable.get(current);

//     return true;
// };

// Game.prototype.createNewDeck = function () {
//     const deck = new Map();
//     let i = 0;

//     for (const s of suites) {
//         for (const v of values) {
//             deck.set(i, Card(s, v));
//             i += 1;
//         }
//     }

//     return deck;
// };

// Game.prototype.newDeckShuffle = function (numberOfShuffles) {
//     const deck = this.deck;
//     const deckSize = deck.size;

//     for (let i = 0; i < numberOfShuffles; i++) {
//         let currentCardIndex = 0;
//         while (currentCardIndex < deckSize) {
//             let randomCardIndex = rand(0, deckSize);

//             let currentCard = deck.get(currentCardIndex);
//             let randomCard = deck.get(randomCardIndex);

//             deck.set(currentCardIndex, randomCard);
//             deck.set(randomCardIndex, currentCard);

//             currentCardIndex += 1;
//         }
//     }

//     return deck;
// };

// Game.prototype.validateDeck = function () {
//     const cards = new Set();

//     for (const [index, card] of this.deck) {
//         const c = { suite: card.suite, value: card.value };

//         if (cards.has(c)) {
//             return false;
//         }

//         cards.add(c);
//     }

//     return true;
// };

// Game.prototype.drawCard = function () {
//     const deck = this.deck;
//     const top = deck.size;
//     const card = deck.get(top - 1);

//     deck.delete(top - 1);
//     this.deck = deck;

//     return card;
// };

// Game.prototype.dealHoleCards = function (allPlayers) {
//     for (const p of allPlayers) {
//         p.holecards.first = {};
//         p.holecards.second = {};
//     }
// };

// module.exports = (n, id) => new Game(n, id);