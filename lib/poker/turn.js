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
    constructor(id, type) {
        this.id = id;
        this.type = type;

        this.start = null;
    }

    get firstAction() {
        return this.start;
    }

    get lastAction() {
        let last = this.start;

        while (last.previous) {
            last = last.previous;
        }

        return last;
    }

    completeAction(action) {
        if (this.start === null) {
            this.start = action;
        } else {
            let latest = this.start;

            while (latest.previous) {
                latest = latest.previous
            }

            latest.previous = action;
        }
    }

    printChain() {
        let latest = this.start;
        console.log('turn type: ' + this.type);
        while (latest) {
            console.log(latest.playerid, latest.type);
            latest = latest.previous;
        }
    }
}

module.exports = Turn;

// const t = new Turn(0, 'preflop');

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