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

    drawDealerButton(i) {
        this.viewRenderHandlers.set('draw-dealer-button', () => {
            const offsetAmount = 64;

            let offsetx = 0;
            let offsety = 0;

            if (i === 0 || i === 1) {
                offsetx = offsetAmount * -1;
                offsety = offsetAmount
            } else if (i === 2 || i === 3) {
                offsetx = offsetAmount * -1;
                offsety = offsetAmount * -1;
            } else if (i === 4) {
                offsety = offsetAmount * -1;
            } else if (i === 5 || i === 6) {
                offsetx = offsetAmount;
                offsety = offsetAmount;
            } else {
                offsetx = offsetAmount;
                offsety = offsetAmount * -1;
            }

            const p = this.table.pointOnTable(i);

            this.dealerbtn.render(p.x + offsetx, p.y + offsety, 0, 0, 64, 64);
        });
    }

    drawSmallBlindButton(i) {
        this.viewRenderHandlers.set('draw-smallblind-button', () => {
            const offsetAmount = 64;

            let offsetx = 0;
            let offsety = 0;

            if (i === 0 || i === 1) {
                offsetx = offsetAmount * -1;
                offsety = offsetAmount * 0.5;
            } else if (i === 2 || i === 3) {
                offsetx = offsetAmount * -1;
                offsety = offsetAmount * -1;
            } else if (i === 4) {
                offsety = offsetAmount * -1;
            } else if (i === 5 || i === 6) {
                offsetx = offsetAmount;
                offsety = offsetAmount;
            } else {
                offsetx = offsetAmount;
                offsety = offsetAmount * -1;
            }

            const p = this.table.pointOnTable(i);

            this.smallblindbtn.render(p.x + offsetx, p.y + offsety, 0, 0, 64, 64);
        });
    }

    drawBigBlindButton(i) {
        this.viewRenderHandlers.set('draw-bigblind-button', () => {
            const offsetAmount = 64;

            let offsetx = 0;
            let offsety = 0;

            if (i === 0 || i === 1) {
                offsetx = offsetAmount * -1;
                offsety = offsetAmount * 0.5;
            } else if (i === 2 || i === 3) {
                offsetx = offsetAmount * -1;
                offsety = offsetAmount * -1;
            } else if (i === 4) {
                offsety = offsetAmount * -1;
            } else if (i === 5 || i === 6) {
                offsetx = offsetAmount;
                offsety = offsetAmount;
            } else {
                offsetx = offsetAmount;
                offsety = offsetAmount * -1;
            }

            const p = this.table.pointOnTable(i);

            this.bigblindbtn.render(p.x + offsetx, p.y + offsety, 0, 0, 64, 64);
        });
    }
}