class HTMLLogger {
    constructor() {
        this.output = document.getElementById('table-log-output');
    }

    log(message) {
        this.output.insertAdjacentHTML('beforeend', `<small>${message}</small>`)
    }
}