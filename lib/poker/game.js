const Action = require('./action');
const Round = require('./round');
const Turn = require('./turn');
const Table = require('./table');
const Dealer = require('./dealer');
const Deck = require('./deck');
const Card = require('./card');
const EventEmitter = require('events');

class GameEvent extends EventEmitter { }

class Game {
    constructor(id, positions, buttonPosition) {
        this.id = id;

        this.dealer = new Dealer();

        this.buttonPosition = buttonPosition;
        this.positions = positions;

        this.blindBetSize = 10;

        Game.log(
            '\n',
            'game created:',
            `game id: ${this.id}`,
            `button: ${this.buttonPosition}`
        );

        this.deck = new Deck();
        this.deck.shuffle(5);

        this.gameEvent = new GameEvent();

        this.gameEvent.once('game-start', (onstart) => {
            onstart(this.id);

            this.dealer.initialise(
                { positions: this.positions, dealerPositionIndex: this.buttonPosition },
                { blindSize: this.blindBetSize, maxRaiseCountPerRound: 3 }
            );

            const smallblind = this.dealer.smallBlind;
            const bigblind = this.dealer.bigBlind;

            smallblind.state.hasBetAction = true;
            bigblind.state.isAnchor = true;

            // this.dealer.activePlayer = smallblind;
            Dealer.logPlayerState('starting player (small blind)', smallblind);

            if (smallblind.state.id !== this.dealer.activePlayer.state.id) {
                Game.log(
                    `err: mismatched id for starting player, got ${smallblind.state.id} but expected ${this.dealer.actingPlayerState.state.id}`
                );
            }

            // this.dealer.activePlayer = smallblind;
            this.dealer.updateGameState(smallblind, 0);

            const sb = Dealer.updateAllowedActionsForPlayer(smallblind, 'postblind');

            this.gameEvent.emit(
                'pass-action-to-player',
                'blind',
                sb.position.seatIndex,
                sb.position.betOrder,
                sb.state.id,
                sb.state.hasActedOnce,
                this.dealer.potSize,
                this.dealer.potBet,
                sb.bets.allowedActions
            );
        });

        this.gameEvent.on('poll-game-state', (onsendstate) => {
            const player = this.dealer.activePlayer;
            const roundState = this.dealer.activeRoundState;

            onsendstate({
                seat: player.position.seatIndex,
                name: this.playerNameLookupBySeat(player.position.seatIndex),
                id: player.state.id,
                round: roundState.name,
                roundsbet: roundState.actionHistory.count,
                betanchor: this.dealer.betAnchor.state.id,
                potsize: this.dealer.potSize,
                clear: false
            });
        });
    };

    playerCompletedAction(id, roundName, action, orderIndex, amount) {
        Game.logPlayerAction(
            'client sent un-validated action with parameters', id, roundName, action, orderIndex, amount
        );

        const placedBet = this.dealer.handlePlayerBet(id, action, roundName, amount);
        const roundState = this.dealer.updateRoundState(placedBet);
        // const roundState = this.dealer.updateGameState(this.activePlayer, this.dealer.potBet);

        Dealer.logPlayerState('validated and completed player action request', this.dealer.activePlayer);
        Dealer.logRoundState('processed player action and updated round', roundState);
        Dealer.logPotState('pot state after processing validated action request', this.dealer.pot);

        if (this.dealer.activePlayer.state.isAnchor) {
            switch (roundState.name) {
                case 'deal':
                    this.gameEvent.emit(
                        'deal-holecards',
                        this.dealer.allValidPlayerStates,
                        this.dealHolecards()
                    );

                    break;
                case 'flop':
                    this.gameEvent.emit(
                        'deal-flop',
                        this.blindBetSize,
                        this.dealFlop()
                    );

                    break;
                default:
                    break;
            }
        }

        roundName = roundState.name;

        const next = this.dealer.findNextActivePlayerInHand(this.dealer.activePlayer);

        const nextPlayerAllowedActions = this.dealer.getAllowedActionsForPlayer(
            next,
            this.dealer.potBet,
            roundName
        );

        next.state.hasBetAction = true;

        Dealer.updateAllowedActionsForPlayer(next, ...nextPlayerAllowedActions);
        Dealer.logPlayerState('next player to act, sending a packet', next);

        this.gameEvent.emit(
            'pass-action-to-player',
            roundName,
            next.position.seatIndex,
            next.position.betOrder,
            next.state.id,
            next.state.hasActedOnce,
            this.dealer.potSize,
            Dealer.calcAmountOwedByPlayer(next, this.dealer.potBet),
            next.bets.allowedActions
        );
    }

    playerNameLookupBySeat(i) {
        return this.positions.find(([k, v]) => k === i)[1].state.name;
    }

    dealHolecards() {
        this.currentRound = 'deal';

        const dealt = new Map();

        for (const p of this.positions) {
            dealt.set(p[1].state.id, {
                a: null, b: null
            });
        }

        for (const p of this.positions) {
            dealt.get(p[1].state.id).a = this.deck.draw();
        }

        for (const p of this.positions) {
            dealt.get(p[1].state.id).b = this.deck.draw();
        }

        return dealt;
    }

    dealFlop() {
        this.currentRound = 'flop';

        const flop = new Map();
        const burn = this.deck.draw();

        let i = 0;

        while (i < 3) {
            flop.set(i, this.deck.draw());
            i++;
        }

        return flop;
    }

    static log(...lines) {
        for (const line of lines) {
            console.log(line);
        }
        console.log('\n');
    };

    static logRoundState(msg, rcur, rnext) {
        console.log('=== === === ===');
        console.log('**');
        console.log(`${msg}:`);
        console.log('**');
        console.log(`round current: ${rcur}`);
        console.log(`round next: ${rnext}`);
        console.log('**');
        console.log('=== === === ===');
        console.log('\n');
    }

    static logPlayerAction(msg, id, r, a, o, b) {
        console.log('=== === === ===');
        console.log('**');
        console.log(`${msg}:`);
        console.log('**');
        console.log(`player id: ${id}`)
        console.log(`game round: ${r}`)
        console.log(`action completed: ${a}`)
        console.log(`turn order position index: ${o}`)
        console.log(`bet action amount: ${b}`)
        console.log('**');
        console.log('=== === === ===');
        console.log('\n');
    }
}

module.exports = Game;