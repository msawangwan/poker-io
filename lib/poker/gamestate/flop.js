const GameState = require('./gamestate');

class Flop extends GameState {
    constructor(id) {
        super(id, 'flop');
    }
}

module.exports = Flop;