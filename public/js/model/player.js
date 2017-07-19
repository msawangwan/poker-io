const generateName = () => `player ${Math.floor(Math.random() * 100)}`;

const namedb = new Set();

const assignName = () => {
    let name = generateName();

    while (namedb.has(name)) { // TODO: lolz this is cray stoopid
        name = generateName();
    }

    namedb.add(name);

    return name;
};

function Player(name, id, balance) {
    this.name = name;
    this.id = id;

    this.balance = balance || 10000;

    this.seat = {
        position: undefined,
        x: 0,
        y: 0
    }

    this.hand = {
        card_one: undefined, card_two: undefined
    };
}

Player.prototype.tookSeat = function(atpos, seatx, seaty) {
    
}

Player.prototype.renderHoleCards = function (globalctx, spritecache) {
    // const ca = this.hand.a;
    // const cb = this.hand.b;

    // const c1Key = spriteCache.makeKey(ca.suite, ca.value);
    // const c2Key = spriteCache.makeKey(cb.suite, cb.value);

    // const scalefactor = 0.75;

    // const cardSprite1 = spriteCache.load(cardspritesheet, c1Key, {
    //     row: ca.value,
    //     col: ca.suite,
    //     width: cardpixelwidth,
    //     height: cardpixelheight
    // });

    // const cardSprite2 = spriteCache.load(cardspritesheet, c2Key, {
    //     row: cb.value,
    //     col: cb.suite,
    //     width: cardpixelwidth,
    //     height: cardpixelheight
    // });


    // spriteCache.draw(cardSprite1, globalctx, this.assignedSeat.x, this.assignedSeat.y, scalefactor, scalefactor);
    // spriteCache.draw(cardSprite2, globalctx, (this.assignedSeat.x + (cardSprite2.width * scalefactor)), this.assignedSeat.y, scalefactor, scalefactor);

    // return true;
};