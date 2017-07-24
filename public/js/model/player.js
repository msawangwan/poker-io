class Player {
    constructor(name, id, balance, cardcanvas) {
        this.name = name;
        this.id = id;
        this.balance = balance;
        this.cardcanvas = cardcanvas;

        this.handlers = new Map();

        this.handlers.set('gameposition', (pos) => {

        });

        this.handlers.set('onthebutton', (button) => {

        });
    };

    get isValid() {
        return this.id !== undefined;
    };

    get turnPositionIndex() {
        return this.turnPosition;
    };

    get seatPositionIndex() {
        return this.seatPosition;
    };

    set turnPositionIndex(i) {
        this.turnPosition = i;
    };

    set seatPositionIndex(i) {
        this.seatPosition = i
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