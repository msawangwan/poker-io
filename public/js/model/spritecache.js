function SpriteCache() {
    this.makeKey = (s, v) => `${s}::${v}`;

    this.spriteDataStore = new Map();
    this.spriteImageStore = new Map();
};

SpriteCache.prototype.load = function (src, key, frame) {
    if (this.spriteDataStore.has(key)) {
        return this.spriteDataStore.get(key);
    }

    const cached = new Sprite(src, frame.row, frame.col, frame.width, frame.height);

    this.spriteDataStore.set(key, cached);

    return cached;
};

SpriteCache.prototype.draw = function (sprite, ctx, dx, dy, sx, sy) {
    let img = this.spriteImageStore.get(sprite.cacheKey);

    if (!img) {
        img = new Image();
        this.spriteImageStore.set(sprite.cacheKey, img);
    }

    sprite.draw(ctx, img, dx, dy, sx, sy);
};