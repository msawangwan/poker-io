const toradian = theta => theta * (Math.PI / 180);

const thetaUpper = toradian(25);
const thetaLower = toradian(325);

const scalingvalue = 0.65;

class Table {
    constructor(maxseats, parentcanvas, textcanvas) {
        this.maxseats = maxseats;

        this.parentcanvas = parentcanvas;
        this.textcanvas = textcanvas;

        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('id', 'canvas-table');

        this.seats = new Map();
        this.onseatCoordsChangeHandlers = new Map();

        this.getSeats = (vacant) => [...this.seats].filter(([i, s]) => s.vacant === vacant);

        this.postion = {
            x: 0, y: 0
        };

        this.canvasorigin = {
            x: 0, y: 0
        }

        this.dimensions = {
            w: 0, h: 0, r: 0, off: 0
        };

        this.labels = {
            center: new Label('serif', 24, 'black')
        };

        this.messageHistory = ['... seating ...'];

        this.drawOnNextUpdate = false;
    };

    render() {
        if (this.drawOnNextUpdate) {
            console.log('drawing table');

            this.drawOnNextUpdate = false;

            this.resize();
            this.draw();

            const msg = this.messageHistory[this.messageHistory.length - 1];

            this.labels.center.draw(
                this.messageHistory[this.messageHistory.length - 1],
                this.textcanvas,
                this.parentcanvas.width / 2,
                this.parentcanvas.height / 2
            );
        }

        for (const [si, so] of this.seats) {
            so.render();
        }
    };

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
    };

    draw() {
        this.canvas.width = this.dimensions.w;
        this.canvas.height = this.dimensions.h;

        const ctx = this.canvas.getContext('2d');

        ctx.beginPath();
        ctx.arc(this.canvasorigin.x - this.dimensions.off, this.canvasorigin.y, this.dimensions.r, Math.PI * 0.5, Math.PI * 0.5 + Math.PI);
        ctx.arc(this.canvasorigin.x + this.dimensions.off, this.canvasorigin.y, this.dimensions.r, Math.PI * 0.5 + Math.PI, Math.PI * 0.5);
        ctx.fillStyle = 'green';
        ctx.fill();

        this.parentcanvas.getContext('2d').drawImage(this.canvas, this.postion.x, this.postion.y);
    };

    seat(seatindex) {
        return this.seats.get(seatindex);
    };

    emptySeat(seatindex) {
        if (this.seats.size > this.maxseats) {
            return false;
        }

        this.seats.set(seatindex, new Seat(this, seatindex, 32, 'black', this.parentcanvas, this.textcanvas));

        return true;
    };

    sit(seatindex, player) {
        const s = this.seats.get(seatindex);

        if (!s) {
            console.log('table: couldnt not find seat at index: ' + seatindex);
            return false;
        }

        Promise.resolve().then(() => {
            this.drawOnNextUpdate = true;
            s.drawOnNextUpdate = true;
        });

        s.player = player;

        return true;
    };

    setCenterLabelText(t) {
        this.messageHistory.push(t);

        Promise.resolve().then(() => {
            this.drawOnNextUpdate = true;
        });
    };

    pointOnTable(position, onchangeHandle) {
        if (onchangeHandle) {
            console.log('registering seat coord change handler');
            this.onseatCoordsChangeHandlers.set(position, onchangeHandle);
        }

        const ox = this.parentcanvas.width / 2;
        const oy = this.parentcanvas.height / 2;
        const r = this.dimensions.r;
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

        for (const [p, h] of this.onseatCoordsChangeHandlers) {
            if (p === position) {
                h(x, y);
            }
        }

        return {
            x: x, y: y
        };
    };
}