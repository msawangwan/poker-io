class DealerState {
    constructor(id, name) {
        this.id = id;
        this.name = name;

        this.actingPlayer = {
            id: -1,
            index: -1,
        };

        this.isOpen = true;
        this.isActive = false;
        this.hasCompleted = false;

        this.nextState = null;
    }
}

module.exports = DealerState;