const namedb = new Set();

class Player {
    constructor(name, id, balance) {
        this.name = name;
        this.id = id;

        this.gameid = null;
        this.balance = balance;

        this.seat = {
            position: undefined,
            x: 0,
            y: 0
        }

        this.holecards = {
            a: null, b: null
        };

        this.drawOnNextUpdate = false;
    };

    render() {
        if (this.drawOnNextUpdate) {
            this.holecards.a.render();
            this.holecards.b.render();
        }
    };

    takeSeatAt(table, pos) {
        this.seat.position = pos;

        setTimeout(() => {
            const { px, py } = table.pointOnTable(pos);

            this.seat.x = px;
            this.seat.y = py;
        }, 1500);
    };

    gotHand(a, b) {
        console.log(a);
        console.log(b);
        this.holecards.a = new Card(a.value, a.suite);
        this.holecards.b = new Card(b.value, b.suite);

        console.log(this.holecards.a.pretty);
        console.log(this.holecards.b.pretty);
    };

    static nullPlayerInstance() {
        return nullInstance;
    };

    static generateGuestName() {
        return `player ${Math.floor(Math.random() * 100)}`;
    };

    static assignGuestName() {
        let name = Player.generateGuestName();

        while (namedb.has(name)) { // TODO: lolz this is cray stoopid
            name = Player.generateGuestName();
        }

        namedb.add(name);

        return name;
    };
}

const nullInstance = new Player('(empty)', -1, 0);