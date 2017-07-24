class Button {
    constructor(parentcanvas, src) {
        this.parentcanvas = parentcanvas;

        this.canvas = document.createElement('canvas');
        this.canvas.setAttribute('id', `canvas-button-${src}`);

        this.src = src;
    };

    render(x, y) {
        const img = new Image();

        img.onload = () => {
            this.parentcanvas.getContext('2d').drawImage(
                img,
                1,
                1,
                64,
                64,
                x,
                y,
                64,
                64
            );
        };

        img.src = this.src;
    }
}