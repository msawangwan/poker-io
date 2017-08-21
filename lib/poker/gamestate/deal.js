const GameState = require('./gamestate');

class Deal extends GameState {
    constructor(id) {
        super(id, 'deal');
    }
}

module.exports = Deal;