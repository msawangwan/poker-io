
const validSuites = ['hearts', 'diamonds', 'clubs', 'spades'];
const validValues = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'jack', 'queen', 'king', 'ace'];

const cardbackpair = './asset/cards-hand-card-back.png';
const cardspritesheet = './asset/cards_52-card-deck_stylized.png';

const cardpixelwidth = 72.15;
const cardpixelheight = 83.25;
const cardbackpixelwidth = 269;
const cardbackpixelheight = 188;

const scalefactor = 1;

let spriteCache = null;

$(document).ready(() => {
    spriteCache = new SpriteCache();
});

class Card {
    constructor(value, suite, parentcanvas) {
        if (this.value === -1 && this.suite === -1) {
            console.log('card is opponent card');
        } else {
            this.value = value;
            this.suite = suite;
        }

        this.parentcanvas = parentcanvas;

        this.key = `${this.value}::${this.suite}`;
        this.pretty = `${Card.valueStr(this.value)} of ${Card.suiteStr(this.suite)}`;

        this.sprite = null;

        this.drawOnNextUpdate = false;
    };

    renderAt(x, y, secondcard) {
        if (this.drawOnNextUpdate) {
            console.log('drawing card');

            this.drawOnNextUpdate = false;
            this.loadFromCache();

            if (secondcard) {
                x += cardpixelwidth;
            }

            spriteCache.draw(this.sprite, this.parentcanvas.getContext('2d'), x, y, scalefactor, scalefactor);
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

    static stringify(c) {
        return `${Card.valueStr(c.value)} of ${Card.suiteStr(c.suite)}`;
    }
}