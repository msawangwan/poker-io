class Action {
    constructor(pid, type) {
        this.ownerId = pid;
        this.type = type;
    }
    
    execute() {
        switch(this.type) {
            case 'bet':
                break;
            default:
                break;
        }
    }
}

module.exports = Action;