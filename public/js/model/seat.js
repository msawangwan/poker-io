class Seat {
    constructor(table, index, radius, color, parentcanvas, textcanvas) {
        this.table = table;

        this.index = index;
        this.id = `canvas-seat-${index}`;

        this.color = color;

        this.vacant = true;
        this.player = Player.none();

        this.parentcanvas = parentcanvas;
        this.textcanvas = textcanvas;

        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('id', this.id);

        this.canvas.width = radius * 2;
        this.canvas.height = radius * 2;

        this.position = {
            x: 0, y: 0
        };

        this.dimensions = {
            w: 0, h: 0, r: radius
        };

        this.labels = {
            player: {
                name: new Label('serif', 18, 'red'),
                balance: new Label('serif', 12, 'red')
            }
        };

        this.redrawHandlers = new Map();

        this.drawOnNextUpdate = false;
    };

    render() {
        if (this.drawOnNextUpdate) {
            console.log(`drawing seat for player: ${this.player ? this.player.name : 'none'}`);

            this.resize();
            this.draw();

            const p = this.table.pointOnTable(this.index);

            let pname = this.player.name;

            if (this.player.isValid) {
                this.labels.player.balance.draw(this.player.balance, this.textcanvas, p.x, p.y + this.labels.player.balance.style.fontsize * 1.25);
            } else {
                pname = '...';
            }

            this.labels.player.name.draw(pname, this.textcanvas, p.x, p.y - this.labels.player.name.style.fontsize * 0.25);

            this.drawOnNextUpdate = false;
        }

        this.player.render();
    };

    resize() {
        this.dimensions.w = this.canvas.width;
        this.dimensions.h = this.canvas.height;

        const p = this.table.pointOnTable(this.index);

        this.position.x = Math.floor(p.x - this.dimensions.w / 2);
        this.position.y = Math.floor(p.y - this.dimensions.h / 2);
    };

    draw() {
        this.canvas.width = this.dimensions.w;
        this.canvas.height = this.dimensions.h;

        const ctx = this.canvas.getContext('2d');

        ctx.arc(this.canvas.width / 2, this.canvas.height / 2, this.dimensions.r, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();

        this.parentcanvas.getContext('2d').drawImage(this.canvas, this.position.x, this.position.y);
    };

    redraw() {
        this.drawOnNextUpdate = true;

        for (const [i, h] of this.redrawHandlers) {
            h();
        }
    }

    occupy(player) {
        console.log(`player occupying seat: ${player.name}`);

        if (!this.vacant) {
            return false;
        }

        this.player = player;

        this.redrawHandlers.set(player.id, () => {
            player.redraw();
        });

        this.redraw();

        return true;
    }
}