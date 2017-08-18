class DealerState {
    constructor(id, name) {
        this.id = id;
        this.name = name;

        this.isActive = false;
        this.hasCompleted = false;

        this.nextState = null;
    }

    process(dealer, player, action) {
        DealerState.logStatus(`
            executing state: ${this.name} 
            player: ${player.state.id}
            action: ${action.name}`
        );

        if (this.hasCompleted) {
            return this.nextState;
        }

        return this;
    }

    static logStatus(optionalMessage) {
        console.log('=');
        console.log('===');
        console.log(`dealer state status`);
        console.log(
            `${optionalMessage ? optionalMessage : 'hasCompleted == `${this.hasCompleted}`'}`
        );
        console.log('===');
        console.log('=\n');
    }
}

module.exports = DealerState;