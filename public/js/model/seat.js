const toradian = theta => theta * (Math.PI / 180);

const thetaUpper = toradian(25);
const thetaLower = toradian(325);


function Seat(parentCtx, position) {
    this.position = position;
    
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', `canvas-seat-${position}`);
    
    this.parentCtx = parentCtx;
    
    this.coordinates = {
        x: 0,
        y: 0
    };
    
    this.tableCoordinates = {
        ox: 0,
        oy: 0,
        radius: 0,
        offset: 0
    };
}

Seat.prototype.render = function(parentOriginx, parentOriginy, parentRadius, parentOffset) {
    this.tableCoordinates.ox = parentOriginx;
    this.tableCoordinates.oy = parentOriginy;
    this.tableCoordinates.radius = parentRadius;
    this.tableCoordinates.offset = parentOffset;
    
    const offsetl = this.tableCoordinates.ox - this.tableCoordinates.offset;
    const offsetr = this.tableCoordinates.ox + this.tableCoordinates.offset;
    const offset = this.tableCoordinates.offset / 2; // TODO: i forget why this exists
    
    const ox = ;
    const oy = ;
    const r = this.tableCoordinates.radius;

    let x = 0;
    let y = 0;
    
    switch (this.position) {
        case 0: // right upper
            x = offsetl;
            y = r;
            break;
        case 1: // right theta upper
            x = offsetr + r * Math.cos(thetaUpper);
            y = o
            break;
            
    }
    
    this.coordinates.x = x;
    this.coordinates.y = y;
};

Seat.prototype.sit = function() {
    
};