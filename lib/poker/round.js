const Action = require('./action');

class Round {
    constructor(phase) {
        this.phase = phase;
        this.lastAction = null;
    }

    act(action) {
        if (this.lastAction === null) {
            this.lastAction = action;
        } else {
            action.previous = this.lastAction;
            this.lastAction = action;
        }
    }
}

module.exports = Round;