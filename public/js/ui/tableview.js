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
        this.seatOutlineSprite = new TableSeatOutlineSprite(this.table.cardcanvas, 'seat-outline');
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

        this.cardsSPRITERENDERER = new Map();
        this.cards = new Map();
        this.cardbacks = new Map();
        this.communityCards = new Map();

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 13; j++) {
                this.cards.set(`${i}::${j}`, new Sprite(this.table.cardcanvas, './asset/cards_52-card-deck_stylized.png'));
                this.cardsSPRITERENDERER.set(`${i}::${j}`, new SpriteRenderer(this.table.cardcanvas, './asset/cards_52-card-deck_stylized.png'));
            }
        }

        this.labels = {
            table: {
                center: new Label('serif', 24, 'black', 'white')
            },
            seat: {
                name: new Map(),
                balance: new Map()
            }
        }

        for (let i = 0; i < 9; i++) {
            this.labels.seat.name.set(i, new Label('serif', 18, 'white', 'black'));
            this.labels.seat.balance.set(i, new Label('serif', 18, 'white', 'black'));
        }
    }

    renderViews(renderbtn, renderchip) {
        const draw = (h, render) => {
            for (const [label, handle] of h) {
                handle(render)
            }
        };

        for (const [id, handler] of this.handlers) {
            switch (id) {
                case 'table':
                    draw(handler, true);
                    break;
                case 'player':
                    draw(handler, true);
                    break;
                case 'button':
                    draw(handler, renderbtn);
                    break;
                case 'card':
                    draw(handler, true);
                    break;
                case 'chip':
                    draw(handler, renderchip);
                    break;
                case 'text':
                    draw(handler, true);
                default:
                    break;
            }
        }
    }

    registerTableDrawHandler() {
        const handler = this.handlers.get('table');
        const handlerlabel = 'table';

        handler.set(handlerlabel, render => {
            const table = this.table;

            const p = table.pointOnTable(-2, 0);

            const dx = Math.floor(table.parentcanvas.width / 2 - p.x);
            const dy = Math.floor(table.parentcanvas.height / 2 - p.y);

            this.tableSprite.draw(
                p.x,
                p.y,
                table.dimensions.r,
                table.dimensions.off,
                table.parentcanvas.width,
                table.parentcanvas.height,
                dx,
                dy
            );
        });

        this.handlers.set('table', handler);

        return handlerlabel;
    }

    registerTableCenterLabelDrawHandler(txt) {
        const handler = this.handlers.get('text');
        const handlerlabel = `label-table-center`;

        let t = '...';

        if (txt) {
            t = txt;
        }

        handler.set(handlerlabel, () => {
            const p = this.table.pointOnTable(-2);
            this.labels.table.center.draw(t, this.table.textcanvas, p.x, p.y - 64, false);
        });

        this.handlers.set('text', handler);

        return handlerlabel;
    }

    registerSeatDrawHandler(i) {
        const handler = this.handlers.get('player');
        const handlerlabel = `seat-${i}`;

        handler.set(handlerlabel, render => {
            const p = this.table.pointOnTable(i);

            const dx = Math.floor(p.x - 32);
            const dy = Math.floor(p.y - 32);

            this.seatSprites.get(i).draw(64, 64, 32, 0, 64, 64, dx, dy);
        });

        this.handlers.set('player', handler);

        return handlerlabel;
    }

    registerActivePlayerSeatOutline(i) {
        const handler = this.handlers.get('card');
        const handlerlabel = 'seat-active-player-outline';

        handler.set(handlerlabel, render => {
            const p = this.table.pointOnTable(i);

            const dx = Math.floor(p.x - 32);
            const dy = Math.floor(p.y - 32);

            this.seatOutlineSprite.draw(64, 64, 32, 0, 64, 64, dx, dy);
        });

        this.handlers.set('card', handler);

        return handlerlabel;
    }

    registerSeatLabelDrawHandler(i, txtname, txtbalance) {
        const handler = this.handlers.get('text');
        const handlerlabel = `label-seat-${i}`;

        handler.set(handlerlabel, render => {
            const seat = this.table.seats.get(i);

            let n = '...';
            let b = ''

            if (seat) {
                if (seat.player.name !== 'empty') {
                    n = seat.player.name;
                }

                if (seat.player.balance || seat.player.balance === 0) {
                    b = seat.player.balance;
                }
            }

            const p = this.table.pointOnTable(i);

            this.labels.seat.name.get(i).draw(n, this.table.textcanvas, p.x, p.y - 16, true);
            this.labels.seat.balance.get(i).draw(b, this.table.textcanvas, p.x, p.y + 16, false);
        });

        this.handlers.set('text', handler);

        return handlerlabel;
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
                    const sp = this.table.pointOnTable(i);
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

        return name;
    }

    registerChipDrawHandler(i, bets) {
        const handler = this.handlers.get('chip');
        const handlerlabel = `chips-${i}`;

        const size = 32;

        handler.set(handlerlabel, render => {
            const pp = this.table.pointOnTable(i);
            const p = this.table.pointOnTable(i, this.table.dimensions.r - size);

            this.chip.render(p.x, pp.y, 0, 0, 64, 64);
        });

        this.handlers.set('chip', handler);

        return handlerlabel;
    }

    registerCardDrawHandler(i, a, b, tint) {
        const handler = this.handlers.get('card');
        const handlerlabel = `card-${i}`;

        const createTransform = (dx, dy, row, col, w, h, scale) => {
            return {
                dx: dx, dy: dy, row: row, col: col, w: w, h: h, scale: scale || 1
            };
        }

        handler.set(handlerlabel, render => {
            const table = this.table;
            const p = table.pointOnTable(i);

            const t1 = createTransform(p.x, p.y, a.value, a.suite, table.cardpixelwidth, table.cardpixelheight);
            const t2 = createTransform(p.x + table.cardpixelwidth, p.y, b.value, b.suite, table.cardpixelwidth, table.cardpixelheight);

            const c1 = this.cardsSPRITERENDERER.get(`${a.suite}::${a.value}`);
            const c2 = this.cardsSPRITERENDERER.get(`${b.suite}::${b.value}`);

            if (tint) {
                const tnt = { color: 'red' };

                c1.render(t1, tnt);
                c2.render(t2, tnt);
            } else {
                c1.render(t1);
                c2.render(t2);
            }

            for (const [s, p] of table.seatsVacant(false)) {
                if (s === i) {
                    continue;
                }

                const p = table.pointOnTable(s, 0);

                if (!this.cardbacks.has(s)) {
                    this.cardbacks.set(s, new Sprite(table.cardcanvas, './asset/cards-hand-card-back.png'));
                }

                this.cardbacks.get(s).renderScaled(p.x, p.y, 0, 0, 269, 188, 0.25, 0.25);
            }
        });

        return handlerlabel;
    }

    registerCommunityCardsDrawHandler(...ccCards) {
        const handler = this.handlers.get('card');
        const handlerlabel = 'community';

        handler.set(handlerlabel, render => {
            const table = this.table;
            const p = table.pointOnTable(-2);

            const numCards = ccCards.length;
            const totalWidth = table.cardpixelwidth * 3;

            let start = p.x - (totalWidth / 2);
            let shift = 0;

            for (const c of ccCards) {
                this.cards.get(table.cardByKey(c)).render(start + shift, p.y, c.value, c.suite, table.cardpixelwidth, table.cardpixelheight);
                shift += table.cardpixelwidth;
            }
        });

        this.handlers.set('card', handler);

        return handlerlabel;
    }

    clearHandler(handlerid, handlerlabel) {
        const handler = this.handlers.get(handlerid);

        handler.delete(handlerlabel);

        this.handlers.set(handlerid, handler);
    }

    clearHandlers(handlerid) {
        const handler = this.handlers.get(handlerid);

        handler.clear();

        this.handlers.set(handlerid, handler);
    }
}