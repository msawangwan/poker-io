class Turn {
    constructor(id, order) {
        this.id = id;
        this.order = order;

        this.phase = null;

        this.next = null;
        this.prev = null;

        this.lastAction = null;

        this.ante = false;
        this.bet = false;
        this.call = false;
        this.check = false;
        this.raise = false;
        this.fold = false;
    }
}

class TurnManager {
    constructor() {
        this.start = null;
    }

    add(playerid, order) {
        const t = new Turn(playerid, order);

        if (this.start === null) {
            this.start = t;
        } else {
            let curr = this.start;

            while (curr.next) {
                curr = curr.next;
            }

            curr.next = t;
            t.prev = curr;
        }
    }

    *inOrder() {
        let curr = this.start;

        while (curr) {
            yield curr;
            curr = curr.next;
        }
    }

    pretty() {
        console.log('===')
        console.log('turn manager pretty print:')
        console.log('*')
        console.log('forward');
        console.log('**');

        let curr = this.start;

        while (curr) {
            console.log(`${curr.id} => ${curr.next ? curr.next.id : '<end>'}`);
            curr = curr.next;
        }

        console.log('**');
        console.log('backward');
        console.log('**');

        curr = this.start;

        while (curr) {
            console.log(`${curr.prev ? curr.prev.id : '<start>'} <= ${curr.id}`);
            curr = curr.next;
        }

        console.log('*')
        console.log('===')
    }
}

module.exports = TurnManager;