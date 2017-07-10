function IdUtil() {
    this.invalidIds = new Set();
    this.nextValidId = -1;

    this.invalidIds.add(this.nextValidId);
}

IdUtil.prototype.generateNextId = function () {
    if (this.invalidIds.has(this.nextValidId)) {
        this.nextValidId++;
    }

    this.invalidIds.add(this.nextValidId);

    return this.nextValidId;
};

module.exports = () => new IdUtil();