class Game {
    constructor(id, players) {
        this.id = id;
        this.players = players;

        console.log('===');
        console.log(this.players);
        console.log('===');
    };

    set onTheButton(position) {
        this.button = position;
    };

    get smallBlind() {
        return this.button + 1 % this.players.length;
    }

    get bigBlind() {
        return this.button + 2 % this.players.length;
    }
}