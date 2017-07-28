const Action = require('./action');

/*
 a turn consists of a chain of actions
 a player takes an action
 turn types can be:
 -ante
 -preflop
 -postflop
 -preriver
 -postriver
*/

class Turn {
    constructor(type) {
        this.type = type;
        this.lastAction = null;
    }

    get firstAction() {
        let last = this.lastAction;

        while (last.previous) {
            last = last.previous;
        }

        return last;
    }

    completeAction(action, phase) {
        let nextPhase = phase;

        if (this.lastAction) {
            console.log("CHECKING LAST ACTION");
            console.log('last actionL ' + this.lastAction.playerid);
            switch (this.lastAction.type) {
                case 'ante':
                    nextPhase = 'preflop';
                    break;
                case 'check':
                    break;
                case 'bet':
                    break;
                case 'raise':
                    break;
                case 'call':
                    break;
                case 'fold':
                    break;
                default:
                    break;
            }
        }

        if (this.lastAction === null) {
            this.lastAction = action;
        } else {
            action.previous = this.lastAction;
            this.lastAction = action;
        }

        return nextPhase;
    }

    printChain() {
        let latest = this.lastAction;
        console.log('turn type: ' + this.type);
        while (latest) {
            console.log('-');
            console.log(`pid: ${latest.playerid} order: ${latest.order} type: ${latest.type}`);
            console.log(`previous action was: ${latest.previous ? latest.previous.order : 'none'}`);
            latest = latest.previous;
        }
    }
}

module.exports = Turn;

// const t = new Turn('preflop');

// t.completeAction(new Action(0, 'check'));
// t.completeAction(new Action(1, 'fold'));
// t.completeAction(new Action(2, 'bet'));
// t.completeAction(new Action(3, 'call'));
// t.completeAction(new Action(4, 'raise'));

// t.printChain();

// console.log('the first action was: ');
// console.log(t.firstAction);
// console.log('the last action was: ');
// console.log(t.lastAction);