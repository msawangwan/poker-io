class Player {
    constructor(name, id, balance, cardcanvas) {
        if (name === emptyPlayer.name && id === emptyPlayer.id) {
            console.log('empty player created');
        } else if (!name || !id) {
            console.log('defaulting to auto character')
        } else {
            console.log('created a new player: ' + name)
        }

        this.cardcanvas = cardcanvas;

        this.name = name || Player.assignGuestName();
        this.id = id || -1;
        this.balance = balance || 0;
        this.gameid = null;

        this.seat = {
            position: undefined,
            x: 0,
            y: 0
        }

        this.holecards = {
            a: null, b: null
        };

        this.hasHolecards = () => this.holecards.a !== null && this.holecards.b !== null;

        this.redrawHandlers = new Map();

        this.drawOnNextUpdate = false;
    };

    render() {
        if (this.drawOnNextUpdate) {
            console.log(`drawing player: ${this.name ? this.name : 'null'}`);

            this.drawOnNextUpdate = false;
        }

        if (this.hasHolecards()) {
            this.holecards.a.renderAt(this.seat.x, this.seat.y);
            this.holecards.b.renderAt(this.seat.x, this.seat.y, true);
        }
    };

    redraw() {
        this.drawOnNextUpdate = true;

        for (const [k, h] of this.redrawHandlers) {
            h();
        }
    };

    takeSeatAt(table, pos) {
        this.seat.position = pos;

        const onSeatCoordsChangedHandler = (x, y) => {
            this.seat.x = x;
            this.seat.y = y;
        };

        setTimeout(() => {
            table.pointOnTable(pos, onSeatCoordsChangedHandler);
        }, 1500);
    };

    gotHand(a, b) {
        this.holecards.a = new Card(a.value, a.suite, this.cardcanvas); // TODO: cache these card instances
        this.holecards.b = new Card(b.value, b.suite, this.cardcanvas); // TODO: cache these card instances

        this.redrawHandlers.set('holecards', () => {
            this.holecards.a.drawOnNextUpdate = true;
            this.holecards.b.drawOnNextUpdate = true;
        });

        this.redraw();
    };

    static opponentPlayerInstance(name, id, balance, canvas) {
        return new Player(name, id, balance, canvas);
    };

    static nullPlayerInstance() {
        return nullInstance;
    };

    static isEmpty(p) {
        return p.name === Player.nullPlayerInstance().name && p.id === Player.nullPlayerInstance().id;
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

const namedb = new Set();

const emptyPlayer = {
    name: '(empty)',
    id: -1,
    balance: 0,
    canvas: undefined
};

const nullInstance = new Player(
    emptyPlayer.name,
    emptyPlayer.id,
    emptyPlayer.balance,
    emptyPlayer.canvas
);