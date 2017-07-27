const Action = require('./action');

class GameFlow {
    constructor() {
        
    }
    
    startTurn(playerid) {
        const a = new Action(playerid, '');
        a.execute();
    }
    
    endTurn() {
        
    }
}