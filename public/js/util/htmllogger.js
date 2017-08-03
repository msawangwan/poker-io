class HTMLLogger {
    constructor() {
        this.output = document.getElementById('table-log-output');
        this.timestamp = new Date();

        this.$messageContainer = $('#container-output');
        this.$messages = $('#table-log-output');
    };

    log(...lines) {
        lines.map(l => this.toHtml(l));
    };

    logobject(o) {
        const props = [];

        for (const p in o) {
            if (o.hasOwnProperty(p)) {
                props.push(`${p}: ${o[p]}`);
            }
        }

        this.delimit(
            `${o.constructor.name !== 'Object' ? o.constructor.name : '* * *'}`,
            ...props
        );
    };

    delimit(...lines) {
        this.log('*')
        this.log(...lines);

        // this.$messageContainer.animate({
        //     scrollTop: this.$messages.prop('scrollHeight') // TODO: blink instead of scroll?
        // }, 'fast');
    };

    toHtml(m) {
        this.output.insertAdjacentHTML(
            'beforeend',
            `<small><b>[${this.timestamp.toLocaleString()}]</b> ${m}</small>`
        );

        this.$messageContainer.scrollTop(this.output.scrollHeight);

        // this.$messageContainer.animate({
        //     scrollTop: this.$messages.prop('scrollHeight') // TODO: blink instead of scroll?
        // }, 'fast');
    };
}