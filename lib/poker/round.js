const Action = require('./action');

class Round {
    constructor(phase) {
        this.phase = phase;

        this.lastAction = null;

        this.anchorpos = 0;
        this.circulations = 0;
    }

    set betAnchorPosition(i) {
        this.betAnchorPositionIndex = i;
    }

    get betAnchorPosition() {
        return this.betAnchorPositionIndex;
    }

    record(action) {
        if (this.lastAction === null) {
            this.lastAction = action;
        } else {
            action.previous = this.lastAction;
            this.lastAction = action;
        }
    }

    playerActed(pid, order, type, amount) {
        this.record(new Action(pid, order, type, amount));
    }
}

module.exports = Round;