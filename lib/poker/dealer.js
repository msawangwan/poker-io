// class Dealer {
//     constructor(options) {
//         this.options = {
//             cap: options.cap || 3
//         };

//         this.deck = null;
//     }

//     initialise(deck) {
//         this.deck = deck;
//         this.deck.shuffle(5);
//     }

//     dealHolecards(players) {
//         const dealt = new Map();

//         for (const p of players) {
//             dealt.set(p[1].id, {
//                 a: null, b: null
//             });
//         }

//         for (const p of players) {
//             dealt.get(p[1].id).a = this.deck.draw();
//         }

//         for (const p of players) {
//             dealt.get(p[1].id).b = this.deck.draw();
//         }

//         return dealt;
//     }

//     dealFlop() {
//         const flop = new Map();
//         const burn = this.deck.draw();

//         let i = 0;

//         while (i < 3) {
//             flop.set(i, this.deck.draw());
//             i++;
//         }

//         return flop;
//     }

//     dealNextCard() {
//         const burn = this.deck.draw();
//         return this.deck.draw();
//     }
// }

// module.exports = Dealer;