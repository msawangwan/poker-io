const toradian = theta => theta * (Math.PI / 180);

const thetaUpper = toradian(25);
const thetaLower = toradian(325);

const scalingvalue = 0.65;

class Table {
    constructor(maxseats, canvasView) {
        this.id = null;

        this.canvasView = canvasView;

        this.parentcanvas = this.canvasView.getCanvas('table-canvas');
        this.playercanvas = this.canvasView.getCanvas('player-canvas');
        this.buttoncanvas = this.canvasView.getCanvas('button-canvas');
        this.chipcanvas = this.canvasView.getCanvas('chip-canvas');
        this.cardcanvas = this.canvasView.getCanvas('card-canvas');
        this.textcanvas = this.canvasView.getCanvas('text-canvas');

        this.canvas = document.createElement('canvas');

        this.canvas.setAttribute('id', 'table-cvs');

        this.tableView = new TableView(this);

        this.seats = new Map();
        this.maxseats = maxseats;

        this.game = null; // TODO: move

        this.postion = {
            x: 0, y: 0
        };

        this.canvasorigin = {
            x: 0, y: 0
        };

        this.dimensions = {
            w: 0, h: 0, r: 0, off: 0
        };

        this.cardpixelwidth = 72.15;
        this.cardpixelheight = 83.25;

        this.drawOnNextUpdate = false;
    };

    get players() {
        return this.seatsVacant(false).map(s => s[1].player);
    };

    get playerCount() {
        return this.seatsVacant(false).length;
    };

    get center() {
        return [
            this.parentcanvas.width * 0.5,
            this.parentcanvas.height * 0.5
        ];
    };

    get centerLabelText() {
        return this.messageHistory.length > 0 ?
            this.messageHistory[this.messageHistory.length - 1] : '...';
    };

    get buttonIndex() {
        return this.db;
    }

    get sbIndex() {
        return this.sb;
    };

    get bbIndex() {
        return this.bb;
    };

    set centerLabelText(t) {
        this.messageHistory.push(t);
        this.redraw();
    };

    set assignedId(id) {
        this.id = id;
    };

    set bbIndex(bb) {
        this.bb = bb;
    }

    set sbIndex(sb) {
        this.sb = sb;
    }

    set buttonIndex(db) {
        this.db = db;
    };

    render() {
        if (this.drawOnNextUpdate) {
            this.resize();
            this.tableView.renderViews(true, true);
            this.drawOnNextUpdate = false;
        }
    }

    // TODO: rename
    resize() {
        this.dimensions.w = Math.floor(this.parentcanvas.width * scalingvalue);
        this.dimensions.h = Math.floor(this.parentcanvas.height * scalingvalue);

        this.canvasorigin.x = Math.floor(this.dimensions.w * 0.5);
        this.canvasorigin.y = Math.floor(this.dimensions.h * 0.5);

        this.postion.x = Math.floor(this.parentcanvas.width / 2 - this.canvasorigin.x);
        this.postion.y = Math.floor(this.parentcanvas.height / 2 - this.canvasorigin.y);

        // TODO: these should be defined elsewhere and the canvas also needs to be sized
        const wide = { small: 0.25, med: 0.35, large: 0.45 };
        const long = { small: 0.15, med: 0.30, large: 0.50 };

        this.dimensions.r = Math.floor(this.dimensions.h * wide.large);
        this.dimensions.off = Math.floor(this.dimensions.w * long.small);
    }

    // TODO: rename
    redraw() {
        this.drawOnNextUpdate = true;
    }

    init() {
        let seatindex = 0;

        while (seatindex < this.maxseats) {
            this.clearSeat(seatindex);
            seatindex += 1;
        }
    }

    clearSeat(seatindex) {
        if (this.seats.size > this.maxseats) {
            return false;
        }

        this.seats.set(
            seatindex,
            new Seat(
                this,
                seatindex,
                32,
                'black',
                this.parentcanvas,
                this.textcanvas
            )
        );

        this.tableView.registerSeatDrawHandler(seatindex);
        this.tableView.registerSeatLabelDrawHandler(seatindex);

        this.drawOnNextUpdate = true;

        return true;
    }

    seatPlayer(index, player) {
        if (!this.seatByIndex(index).vacant) {
            return false;
        }

        const seat = this.seatByIndex(index);

        seat.vacant = false;
        seat.player = player;

        player.seatPositionIndex = index;

        this.tableView.registerSeatLabelDrawHandler(index, player.name, player.balance);

        this.setSeatByIndex(index, seat);

        return true;
    }

    seatOpponents(seatingState, currentPlayerId) {
        for (const seat of seatingState) {
            if (seat[1].vacant) {
                continue;
            } else if (seat[1].player.id === currentPlayerId) {
                this.seats.get(seat[0]).player.balance = seat[1].player.balance;
                continue;
            }

            const opponent = new Player(
                seat[1].player.name,
                seat[1].player.id,
                seat[1].player.balance,
                null
            );

            opponent.seatPositionIndex = seat[0];

            this.seatPlayer(seat[0], opponent);
        }

        this.redraw();
    }

    seatsVacant(vacant) {
        return [...this.seats].filter(([i, s]) => s.vacant === vacant);
    }

    seatCount(vacant) {
        return this.seatsVacant(vacant).length;
    }

    seatByIndex(seatindex) {
        return this.seats.get(seatindex);
    }

    setSeatByIndex(seatindex, seat) {
        this.seats.set(seatindex, seat);
    }

    cardByKey(c) {
        return `${c.suite}::${c.value}`;
    }

    pointOnTable(position, radius, onchangeHandle) {
        const ox = this.parentcanvas.width / 2;
        const oy = this.parentcanvas.height / 2;
        const r = radius ? radius : this.dimensions.r;
        const off = this.dimensions.off;

        const offsetLeft = ox - off;
        const offsetRight = ox + off;

        let x = -1;
        let y = -1;

        switch (position) {
            case -2: // center
                x = ox;
                y = oy;
                break;
            case -1: // center upper
                x = ox;
                y = oy - r;
                break;
            case 0: // right upper
                x = offsetRight;
                y = oy - r;
                break;
            case 1: // right theta upper
                x = offsetRight + r * Math.cos(thetaUpper);
                y = oy - r * Math.sin(thetaUpper);
                break;
            case 2: // right theta lower
                x = offsetRight + r * Math.cos(thetaLower);
                y = oy - r * Math.sin(thetaLower);
                break;
            case 3: // right lower
                x = offsetRight;
                y = oy + r;
                break;
            case 4: // center lower
                x = ox;
                y = oy + r;
                break;
            case 5: // left lower
                x = offsetLeft;
                y = oy + r;
                break;
            case 6: // left theta lower
                x = offsetLeft - r * Math.cos(thetaLower);
                y = oy - r * Math.sin(thetaLower);
                break;
            case 7: // left theta upper
                x = offsetLeft - r * Math.cos(thetaUpper);
                y = oy - r * Math.sin(thetaUpper);
                break;
            case 8: // left upper
                x = offsetLeft;
                y = oy - r;
                break;
            default:
                console.log('err: invalid table position');
                break;
        }

        x = Math.floor(x);
        y = Math.floor(y);

        return {
            x: x, y: y
        };
    }
}