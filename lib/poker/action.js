class Action {
    constructor(playerid, type) {
        this.playerid = playerid;
        this.type = type;

        this.previous = null;
    }


}

module.exports = Action;