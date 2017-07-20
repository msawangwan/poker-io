const generateName = () => `player ${Math.floor(Math.random() * 100)}`;

const namedb = new Set();

const assignName = () => {
    let name = generateName();

    while (namedb.has(name)) { // TODO: lolz this is cray stoopid
        name = generateName();
    }

    namedb.add(name);

    return name;
};

class Player {
    constructor(name, id, balance) {
        this.name = name;
        this.id = id;
        this.gameid = null;

        this.balance = balance || 10000;

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
}