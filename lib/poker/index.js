const gamectr = require('./game');

module.exports = {
    newGame: (name, id) => gamectr(name, id)
};