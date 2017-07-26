class Turn {
    constructor(id) {
        this.id = id;

        this.next = null;

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

    add(playerid) {
        if (this.start === null) {
            this.start = new Turn(playerid);
        } else {
            let curr = this.start;

            while (curr.next) {
                curr = curr.next;
            }

            curr.next = new Turn(playerid);
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

        let curr = this.start;

        while (curr) {
            console.log(`${curr.id} -=> ${curr.next ? curr.next.id : '<end>'}`);
            curr = curr.next;
        }

        console.log('*')
        console.log('===')
    }
}

module.exports = TurnManager;