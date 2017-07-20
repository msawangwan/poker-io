class SeatObject {
    constructor(index, radius, color) {
        this.index = index;
        this.id = `canvas-seat-${index}`;

        this.color = color;

        this.vacant = true;
        this.player = Player.nullPlayerInstance();

        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('id', this.id);

        this.canvas.width = radius * 2;
        this.canvas.height = radius * 2;

        this.position = {
            x: 0, y: 0
        };

        this.dimensions = {
            w: 0, h: 0, r: 0, off: 0
        };

        this.labels = {
            player: {
                name: new Label('serif', 18, 'red'),
                balance: new Label('serif', 18, 'red')
            }
        };
    };
}