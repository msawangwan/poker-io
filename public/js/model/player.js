const namedb = new Set();

class Player {
    constructor(name, id, balance) {
        this.name = name;
        this.id = id;

        this.gameid = null;

        // this.balance = balance || 10000;
        this.balance = balance;

        this.seat = {
            position: undefined,
            x: 0,
            y: 0
        }

        this.hand = {
            card_one: undefined, card_two: undefined
        };
    };

    sitAt(table, pos) {
        this.seat.position = pos;

        setTimeout(() => {
            this.updateSeatCoordinates(table, pos);
        }, 1500);
    };

    updateSeatCoordinates(table, pos) {
        const [px, py] = table.getTablePosByIndex(pos);
        this.seat.x = px;
        this.seat.y = py;
    };

    static nullPlayerInstance() {
        return nullInstance;
    }

    static generateGuestName() {
        return `player ${Math.floor(Math.random() * 100)}`;
    }

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