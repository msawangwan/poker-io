const generateName = () => `player ${Math.floor(Math.random() * 100)}`;

const namedb = new Set();

const assignName = () => {
    let name = generateName();
    
    while (namedb.has(name)) { // TODO: lolz this is cray stoopid
        name = generateName();
    }
    
    namedb.add(name);
    
    return name;
};

function Player(name, id, balance) {
    this.name = name;
    this.id = id;
    
    this.state = {
        balance: balance || 10000,
        seatedAt: undefined
    };
    
    this.gameState = {
        game: {
            id: undefined
        },
        deck: {
            id: undefined
        },
        deal: {
            id: undefined
        },
        hand: {
            id: undefined,
            holecard: {
                a: undefined,
                b: undefined
            }
        }
    };
}