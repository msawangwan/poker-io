const GameState = require('./gamestate');

class Turn extends GameState {
    constructor(id) {
        super(id, 'turn');
    }
}

module.exports = Turn;