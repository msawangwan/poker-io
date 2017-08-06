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
                // if (props.length) {

                // }
                props.push(`${p}: ${o[p]}`);
            }
        }

        this.log(
            `${o.constructor.name !== 'Object' ? o.constructor.name : 'data_object'}`,
            ...props
        );
    };

    toHtml(m) {
        this.output.insertAdjacentHTML(
            'beforeend',
            `<small><b>[${this.timestamp.toLocaleString()}]</b> ${m}</small>`
        );

        this.$messageContainer.scrollTop(this.output.scrollHeight);
    };
}