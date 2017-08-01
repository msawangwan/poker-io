class TableView {
    constructor(table) {
        this.table = table;

        this.handlers = new Map();

        for (const [k, v] of this.table.canvasView.canvi) {
            this.handlers.set(
                k.split('-')[0],
                new Map()
            );
        }

        this.tableSprite = new TableSprite(this.table.parentcanvas, 'table');
        this.seatSprites = new Map();

        for (let i = 0; i < 9; i++) {
            this.seatSprites.set(
                i,
                new TableSeatSprite(this.table.playercanvas, `seat-${i}`)
            );
        }

        this.dealerbtn = new Sprite(this.table.buttoncanvas, './asset/btn-dealer.png');
        this.smallblindbtn = new Sprite(this.table.buttoncanvas, './asset/btn-sb.png');
        this.bigblindbtn = new Sprite(this.table.buttoncanvas, './asset/btn-bb.png');
        this.chip = new Sprite(this.table.chipcanvas, './asset/chip.png');

        this.cardpixelwidth = 72.15;
        this.cardpixelheight = 83.25;

        this.cards = new Map();
        this.cardbacks = new Map();
        this.communityCards = new Map();

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 13; j++) {
                this.cards.set(`${i}::${j}`, new Sprite(this.table.cardcanvas, './asset/cards_52-card-deck_stylized.png'));
            }
        }
    }

    renderViews() {
        for (const [id, handler] of this.handlers) {
            for (const [label, handle] of handler) {
                handle(true);
            }
        }
    }

    drawTable() {

    }

    registerButtonDrawHandler(name, i) {
        const handler = this.handlers.get('button');

        const innerRadius = 0.90;
        const size = 64;

        switch (name) {
            case 'sb':
                handler.set(name, render => {
                    const sp = this.table.pointOnTable(i, 0);
                    const p = this.table.pointOnTable(i, this.table.dimensions.r - size);

                    this.smallblindbtn.render(
                        sp.x - (Math.abs(sp.x - p.x) * 2),
                        sp.y * innerRadius,
                        0,
                        0,
                        64,
                        64
                    );
                });
                break;
            case 'bb':
                handler.set(name, render => {
                    const sp = this.table.pointOnTable(i, 0);
                    const p = this.table.pointOnTable(i, this.table.dimensions.r - size);

                    this.bigblindbtn.render(
                        sp.x - (Math.abs(sp.x - p.x) * 2),
                        sp.y * innerRadius,
                        0,
                        0,
                        64,
                        64
                    );
                });
                break;
            case 'dealer':
                handler.set(name, render => {
                    const sp = this.table.pointOnTable(i, 0);
                    const p = this.table.pointOnTable(i, this.table.dimensions.r - size);

                    this.dealerbtn.render(
                        sp.x - (Math.abs(sp.x - p.x) * 2),
                        sp.y * innerRadius,
                        0,
                        0,
                        64,
                        64
                    );
                });
                break;
            default:
                console.log('err: unknown draw handler: ' + name);
                break;
        }

        this.handlers.set('button', handler);
    }

    registerChipDrawHandler(i) {
        const handler = this.handlers.get('chip');

        const size = 32;
        handler.set(`chips-${i}`, render => {
            const p = this.pointOnTable(i, this.table.dimensions.r - size);

            // todo ...
        });

        this.handlers.set('chip', handler);
    }
}