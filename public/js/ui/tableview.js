class TableView {
    constructor(canvasView) {
        this.viewRenderers = new Map();

        this.parentCanvas = canvasView.parentCanvas;

        for (const [id, c] of canvasView.canvi) {
            this.viewRenderers.set(id, {
                canvas: c,
                drawHandlers: new Map()
            });
        }


        this.labels = {
            center: new Label('serif', 24, 'black')
        };

        this.messageHistory = ['... seating ...'];

        this.dealerbtn = new Sprite(this.buttoncanvas, './asset/btn-dealer.png');
        this.sbbtn = new Sprite(this.buttoncanvas, './asset/btn-sb.png');
        this.bbbtn = new Sprite(this.buttoncanvas, './asset/btn-bb.png');

        this.chip = new Sprite(this.chipcanvas, './asset/chip.png');

        const cardspritesheet = './asset/cards_52-card-deck_stylized.png';
        const cardbacksheet = './asset/cards-hand-card-back.png';

        this.cardpixelwidth = 72.15;
        this.cardpixelheight = 83.25;

        this.cards = new Map();
        this.cardbacks = new Map();
        this.communityCards = new Map();

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 13; j++) {
                this.cards.set(`${i}::${j}`, new Sprite(this.cardcanvas, './asset/cards_52-card-deck_stylized.png'));
            }
        }

    }
}