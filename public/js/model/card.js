
const validSuites = ['hearts', 'diamonds', 'clubs', 'spades'];
const validValues = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king', 'ace'];

const cardbackpair = './asset/cards-hand-card-back.png';
const cardspritesheet = './asset/cards_52-card-deck_stylized.png';

const cardpixelwidth = 72.15;
const cardpixelheight = 83.25;
const cardbackpixelwidth = 269;
const cardbackpixelheight = 188;

let spriteCache = null;

$(document).ready(() => {
    spriteCache = new SpriteCache();
});

class Card {
    constructor(value, suite) {
        this.value = value;
        this.suite = suite;

        this.key = `${this.value}::${this.suite}`;
        this.pretty = `${Card.valueStr(this.value)} of ${Card.suiteStr(this.suite)}`;

        this.sprite = null;

        this.drawOnNextTick = false;
    };

    renderAt(x, y, ctx) {
        if (this.drawOnNextTick) {
            spriteCache.draw(this.sprite, ctx, x, y, scalefactor, scalefactor)
        }
    };

    loadFromCache() {
        this.sprite = spriteCache.load(cardspritesheet, this.key, {
            row: this.value,
            col: this.suite,
            width: cardpixelwidth,
            height: cardpixelheight
        });
    };

    static valueStr(v) {
        return `${validValues[v]}`
    };

    static suiteStr(s) {
        return `${validSuites[s]}`
    };
}

// const drawPlayerHand = () => {
//     if (!playerState.holeCards.a || !playerState.holeCards.b) {
//         return false;
//     }

//     const cardA = playerState.holeCards.a;
//     const cardB = playerState.holeCards.b;

//     const cardAsuite = playerState.holeCards.strings.af.suite;
//     const cardAvalue = playerState.holeCards.strings.af.value;
//     const cardBsuite = playerState.holeCards.strings.bf.suite;
//     const cardBvalue = playerState.holeCards.strings.bf.value;

//     const c1Key = spriteCache.makeKey(cardAsuite, cardAvalue);
//     const c2Key = spriteCache.makeKey(cardBsuite, cardBvalue);

//     const scalefactor = 0.75;

//     const cardSprite1 = spriteCache.load(cardspritesheet, c1Key, {
//         row: cardA.value,
//         col: cardA.suite,
//         width: cardpixelwidth,
//         height: cardpixelheight
//     });

//     const cardSprite2 = spriteCache.load(cardspritesheet, c2Key, {
//         row: cardB.value,
//         col: cardB.suite,
//         width: cardpixelwidth,
//         height: cardpixelheight
//     });


//     spriteCache.draw(cardSprite1, ctx, playerState.assignedSeat.x, playerState.assignedSeat.y, scalefactor, scalefactor);
//     spriteCache.draw(cardSprite2, ctx, (playerState.assignedSeat.x + (cardSprite2.width * scalefactor)), playerState.assignedSeat.y, scalefactor, scalefactor);

//     return true;
// };

// const drawAllOpponentActiveHand = (seatCoordinates, seatStates) => {
//     if (!seatStates) {
//         return false;
//     }

//     for (const [position, coord] of seatCoordinates.entries()) {
//         if (position > 0) { // note: valid player seat positions are exclusive to numbers 1-9
//             const seat = seatStates[position - 1];

//             if (!seat[1].vacant) {
//                 const p = seat[1].player;

//                 if (p.id === socket.id) {
//                     continue;
//                 }

//                 const key = spriteCache.makeKey(`cardback::${position}`)

//                 const handBackside = spriteCache.load(cardbackpair, key, {
//                     row: 0,
//                     col: 0,
//                     width: cardbackpixelwidth,
//                     height: cardbackpixelheight
//                 });

//                 spriteCache.draw(handBackside, ctx, coord.x, coord.y, 0.25, 0.25);
//             }
//         }
//     }

//     return true;
// };