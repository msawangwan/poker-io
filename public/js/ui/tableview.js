class TableView {
    constructor(table) {
        this.table = table;

        this.viewRenderHandlers = new Map();

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
        for (const [id, handler] of this.viewRenderHandlers) {
            handler();
        }
    }

    drawTable() {

    }

    registerButtonDrawHandler(name, i) {
        const innerRadius = 0.90;
        const size = 64;

        switch (name) {
            case 'sb':
                this.viewRenderHandlers.set(name, () => {
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
                this.viewRenderHandlers.set(name, () => {
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
                this.viewRenderHandlers.set(name, () => {
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
    }

    registerChipDrawHandler(name, i) {
        this.viewRenderHandlers.set(name, () => {

        });
    }
}