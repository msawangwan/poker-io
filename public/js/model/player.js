class Player {
    constructor(name, id, balance, cardcanvas) {
        this.name = name;
        this.id = id;
        this.balance = balance;
        this.cardcanvas = cardcanvas;

        this.canvas = {
            layer: cardcanvas,
            position: {
                x: 0,
                y: 0,
            }
        };

        this.seat = {
            position: undefined,
            x: 0,
            y: 0
        };

        this.gameid = null;

        this.holecards = {
            a: null, b: null
        };

        this.hasHolecards = () => this.holecards.a !== null && this.holecards.b !== null;

        this.renderHandlers = new Map();

        this.drawOnNextUpdate = false;
    };

    get isValid() {
        return this.id !== undefined;
    };

    get canvasCoordinates() {
        return [this.canvas.position.x, this.canvas.position.y];
    };

    set canvasCoordinates(c) {
        this.canvas.position.x = c[0];
        this.canvas.position.y = c[1];
    }

    render() {
        if (this.drawOnNextUpdate) {
            console.log(`drawing player: ${this.name ? this.name : 'null'}`);

            this.drawOnNextUpdate = false;

            if (this.hasHolecards()) {
                this.holecards.a.renderAt(this.seat.x, this.seat.y);
                this.holecards.b.renderAt(this.seat.x, this.seat.y, true);
            }
        }
    };

    redraw() {
        this.drawOnNextUpdate = true;

        for (const [k, h] of this.renderHandlers) {
            h();
        }
    };

    joinTable(table, pos) {
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

        this.renderHandlers.set('holecards', () => {
            this.holecards.a.drawOnNextUpdate = true;
            this.holecards.b.drawOnNextUpdate = true;
        });

        this.redraw();
    };

    static exists(player) {
        return player.id !== undefined;
    };

    static none() {
        return instance.nullPlayer;
    };
}

const instance = {
    nullPlayer: new Player('empty', undefined, undefined, undefined)
};