class LabelManager {
    constructor() {
        this.cache = new Map();
    };

    add(name, label, calcx, calcy) {
        const group = this.cache.get(name);

        if (!group) {
            return false;
        }

        group.push({
            label: label,
            calcx: calcx,
            calcy: calcy
        });

        this.cache.set(name) = group;

        return true;
    };

    recalc(name) {
        const group = this.cache.get(name);

        if (group) {
            for (const l of group) {

            }
        }
    }
}