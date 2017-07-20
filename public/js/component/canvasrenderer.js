const uuid = 1;

class CanvasRenderer {
    constructor(globalCanvas) {
        this.id = uuid + 1;

        this.globalCanvas = globalCanvas;

        this.localCanvas = document.createElement('canvas');
        this.localCanvas.setAttribute('id', `canvas-object-${this.id}`);

        this.transform = new CanvasTransform();

        this.renderOnNextUpdate = true;
    };
}