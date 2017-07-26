class Turn {
    constructor(id) {
        this.id = id;

        this.next = null;

        this.anted = false;
        this.preflop = false;
        this.postflop = false;
        this.preriver = false;
        this.postflop = false;
    }
}

class TurnManager {
    constructor() {
        this.start = null;
    }

    add(playerid) {
        if (this.start === null) {
            this.start = new Turn(playerid);
        } else {
            const t = new Turn(playerid);
            t.next = this.start;
            this.start = t;
        }
    }

    pretty() {
        console.log('===')
        console.log('turn manager pretty print:')
        console.log('*')

        let curr = this.start;

        while (curr) {
            console.log(`${curr.id} -=> ${curr.next ? curr.next.id : 'end'}`);
            curr = curr.next;
        }

        console.log('*')
        console.log('===')
    }
}

module.exports = TurnManager;