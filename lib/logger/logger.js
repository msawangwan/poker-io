function Logger(header) {
    this.header = header;
    this.messageid = 0;
}

Logger.prototype.log = function (statement, ...messages) {
    let text = '\t...';

    if (messages.length > 0) {
        const jointext = (...messages) => messages.map(m => `\t${m}\n`).join('');
    } else {
        text += '\n';
    }

    text += '\n';

    console.log(`===\n[${this.header}][messageid: ${this.messageid}] :: *${statement}*\n\n${text}`);

    this.messageid++;
};

module.exports = header => new Logger(header); 