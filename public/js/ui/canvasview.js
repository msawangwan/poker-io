class CanvasView {
    constructor(parentCanvasId) {
        this.parentCanvasId = parentCanvasId;

        this.parentCanvas = document.getElementById(this.parentCanvasId);
        this.parentCanvas.addEventListener('selectstart', e => e.preventDefault()); // don't highlight text if we dbl click the canvas area

        const ids = [
            'table-canvas',
            'player-canvas',
            'card-canvas',
            'button-canvas',
            'chip-canvas',
            'text-canvas'
        ];

        this.canvi = new Map([
            [ids[0], document.getElementById(ids[0])],
            [ids[1], document.getElementById(ids[1])],
            [ids[2], document.getElementById(ids[2])],
            [ids[3], document.getElementById(ids[3])],
            [ids[4], document.getElementById(ids[4])],
            [ids[5], document.getElementById(ids[5])]
        ]);

        this.contexts = new Map([
            [ids[0], this.canvi.get(ids[0]).getContext('2d')],
            [ids[1], this.canvi.get(ids[1]).getContext('2d')],
            [ids[2], this.canvi.get(ids[2]).getContext('2d')],
            [ids[3], this.canvi.get(ids[3]).getContext('2d')],
            [ids[4], this.canvi.get(ids[4]).getContext('2d')],
            [ids[5], this.canvi.get(ids[5]).getContext('2d')]
        ]);

        this.layerById = ids;
    }

    getId(i) {
        return this.ids[i];
    }

    getCanvas(i) {
        return this.canvi.get(i);
    }

    getCtx(i) {
        return this.contexts.get(i);
    }

    clearCanvas(i) {
        const w = this.parentCanvas.offsetWidth;
        const h = this.parentCanvas.offsetHeight;

        const c = this.canvi.get(i);

        c.width = w;
        c.height = h;
    }

    clearAndResizeAll() {
        const w = this.parentCanvas.offsetWidth;
        const h = this.parentCanvas.offsetHeight;

        for (const [id, canv] of this.canvi) {
            canv.width = w;
            canv.height = h;
        }
    }
}