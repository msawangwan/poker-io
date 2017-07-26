class HTMLLogger {
    constructor() {
        this.output = document.getElementById('table-log-output');
        this.timestamp = new Date();
    };

    log(...lines) {
        lines.map(l => this.toHtml(l));
    };

    delimit(...lines) {
        this.log('=-- * * * =--')
        this.log(...lines);
    }

    logobject(o) {
        const props = [];
        for (const p in o) {
            if (o.hasOwnProperty(p)) {
                props.push(`${p}: ${o.p}`);
            }
        }

        this.delimit(`${o.constructor.name !== 'Object' ? o.constructor.name : 'data:'}`, ...props);
    }

    toHtml(m) {
        this.output.insertAdjacentHTML('beforeend', `<small>[${this.timestamp.toLocaleString()}] ${m}</small>`);
    };
}