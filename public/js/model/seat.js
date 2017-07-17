function Seat(position, coordinates, container) {
    this.position = position;
    this.coordinates = coordinates;
    this.container = container;

    this.canvas = $('<canvas></canvas>').attr({
        id: `canvas-seat-${position}`
    }).css({
        border: `1px solid red'`
    }).appendTo(`#${container}`);
}