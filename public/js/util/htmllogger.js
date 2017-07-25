class HTMLLogger {
    constructor() {
        this.output = document.getElementById('table-log-output');
        this.timestamp = new Date();
    };

    log(message) {
        this.output.insertAdjacentHTML('beforeend', `<small>[${this.timestamp.toLocaleString()}] ${message}</small>`)
    };
}