class Action {
    constructor(playerid, order, type) {
        this.playerid = playerid;
        this.order = order;

        this.type = type;

        this.previous = null;
    }

    get allowedResponseActions() {
        switch (this.type) {
            case 'ante':
                return ['bigblind'];
            case 'check':
                return ['check', 'bet', 'fold'];
            case 'bet':
                return ['call', 'raise', 'fold'];
            case 'raise':
                return ['call', 'raise', 'fold'];
            case 'call':
                return ['check', 'bet', 'fold'];
            case 'fold':
                return ['call', 'raise', 'fold'];
        }
    }
}

module.exports = Action;