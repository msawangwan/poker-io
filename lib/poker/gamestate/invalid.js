const GameState = require('./gamestate');

class Invalid extends GameState {
    constructor(id) {
        super(id, 'invalid');
    }
}

module.exports = Invalid;