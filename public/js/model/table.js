// const toradian = theta => theta * (Math.PI / 180);

// const thetaUpper = toradian(25);
// const thetaLower = toradian(325);

const maxSeats = 9; // TODO: load from config

class Table {
    constructor(id) {
        this.id = id;

        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('id', 'canvas-table');

        this.seats = new Map();

        this.transform = {
            local: {
                center: {
                    x: 0,
                    y: 0
                }
            },
            global: {
                centeredAt: {
                    x: 0,
                    y: 0,
                }
            },
            w: 0,
            h: 0,
            radius: 0,
            offset: 0,
        };

        this.canvasChanged = true;
        this.drawOnNextTick = true;


        // this.centerlabel = this.labelCache.addNewLabel('serif', 18, 'white');
    };

    resize(newCanvas) {
        const t = this.transform;

        t.w = Math.floor(parentCanvas.width * scale);
        t.h = Math.floor(parentCanvas.height * scale);

        t.local.center.x = Math.floor(t.w * 0.5);
        t.local.center.y = Math.floor(t.h * 0.5);

        t.global.centeredAt.x = Math.floor(parentCanvas.width / 2 - t.local.center.x);
        t.global.centeredAt.y = Math.floor(parentCanvas.height / 2 - t.local.center.y);

        t.radius = Math.floor(t.h / 4);
        t.offset = Math.floor(t.w * 0.15);

        this.transform = t;

    }

    updateTransform(parentCanvas, scale) {
        if (this.canvasChanged) {
            const t = this.transform;

            t.w = Math.floor(parentCanvas.width * scale);
            t.h = Math.floor(parentCanvas.height * scale);

            t.local.center.x = Math.floor(t.w * 0.5);
            t.local.center.y = Math.floor(t.h * 0.5);

            t.global.centeredAt.x = Math.floor(parentCanvas.width / 2 - t.local.center.x);
            t.global.centeredAt.y = Math.floor(parentCanvas.height / 2 - t.local.center.y);

            t.radius = Math.floor(t.h / 4);
            t.offset = Math.floor(t.w * 0.15);

            this.transform = t;

            this.drawOnNextTick = true;
        } else {
            this.drawOnNextTick = false;
        }

        this.canvasChanged = false;
    };

    render(toParentCanvas) {
        if (this.drawOnNextTick) {
            const t = this.transform;

            this.canvas.width = t.w;
            this.canvas.height = t.h;

            const localctx = this.canvas.getContext('2d');

            localctx.clearRect(0, 0, t.w, t.h);
            localctx.beginPath();
            localctx.arc(t.local.center.x - t.offset, t.local.center.y, t.radius, Math.PI * 0.5, Math.PI * 0.5 + Math.PI);
            localctx.arc(t.local.center.x + t.offset, t.local.center.y, t.radius, Math.PI * 0.5 + Math.PI, Math.PI * 0.5);
            localctx.fillStyle = 'green';
            localctx.fill();

            toParentCanvas.getContext('2d').drawImage(this.canvas, t.global.centeredAt.x, t.global.centeredAt.y);
            console.log('redraw table');
            if (this.labels.center.label) {
                console.log('redraw label');
                this.labels.center.label.textChanged = true;
            }
        }

        this.drawOnNextTick = false;
    };

    pointOnTable(parentCanvas, position) {
        const ox = parentCanvas.width / 2;
        const oy = parentCanvas.height / 2;
        const r = this.transform.radius;
        const off = this.transform.offset;

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
                break;
        }

        return {
            x: x, y: y
        };
    };

    getTablePosByIndex(index) {
        if (!this.seats.has(index)) {
            return undefined;
        }

        const seat = this.seats.get(index);

        return [seat.transform.origin.global.x, seat.transform.origin.global.y];
    };

    addSeat(seat) {
        if (this.seats.size > maxSeats) {
            return false;
        }

        this.seats.set(seat.position, seat);

        return true;
    };

    playerSeatedAt(position, player) {
        let desired = undefined;

        for (const [si, s] of this.seats) {
            if (si == position) {
                desired = s;
                break;
            }
        }

        if (!desired.vacant) {
            return false;
        }

        desired.vacant = false;
        desired.player = player;

        return true;
    };

    playerLeftSeat(position, player) {
        let desired = undefined;

        for (const [si, s] of this.seats) {
            if (si == position) {
                desired = s;
            }
        }

        if (desired.vacant) {
            return false; // no player sits there
        }

        desired.vacant = true;
        desired.player = undefined;

        return true;
    };
}