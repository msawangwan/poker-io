const logctr = require('./logger');

module.exports = (loggerName) => {
    return logctr(loggerName);
};