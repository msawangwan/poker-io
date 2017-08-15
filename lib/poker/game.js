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

            this.dealer.initialise(this.blindBetSize);
            this.dealer.setPlayerStatesOnInit(this.positions, this.buttonPosition);

            const sb = this.dealer.smallBlind;

            if (sb.player.id === this.dealer.actingPlayerState.player.id) {
                Game.log(
                    `small blind, aka starting player, id: ${sb.player.id}`
                );
            } else {
                Game.log(
                    `err: mismatched id for starting player, got ${sb.player.id} but expected ${this.dealer.actingPlayerState.player.id}`
                );
            }

            this.dealer.updateGameState(sb);
            this.dealer.setPlayerStateAllowedActions(sb, 'postblind');

            this.gameEvent.emit(
                'pass-action-to-player',
                'blind',
                sb.position.seatIndex,
                sb.position.betOrder,
                sb.player.id,
                sb.hasActed,
                this.dealer.pot.size,
                this.dealer.blindBetSize,
                sb.actions.allowed
            );
        });

        this.gameEvent.on('poll-game-state', (onsendstate) => {
            const acting = this.dealer.actingPlayerState;
            const id = acting.player.id;
            const seat = acting.position.seatIndex;
            const name = this.playerNameLookupBySeat(seat);
            const round = this.dealer.activeRound.name;
            const roundsbet = this.dealer.activeRound.actions.count;
            const betanchor = this.dealer.betAnchor.player.id;
            const potsize = this.dealer.pot.size;

            Game.log(
                'game state update request',
                `hand phase: ${round}`,
                `bet round: ${roundsbet}`,
                `bet anchor pos: ${betanchor}`,
                `pot size: ${potsize}`,
                `current turn seat: ${seat}`,
                `current turn name: ${name}`,
                `current turn id: ${id}`
            );

            onsendstate({
                seat: seat,
                name: name,
                id: id,
                round: round,
                roundsbet: roundsbet,
                betanchor: betanchor,
                potsize: potsize,
                clear: false
            });
        });
    };

    // A betting round ends when two conditions are met:
    // All players have had a chance to act.
    // All players who haven't folded have bet the same amount of money for the round

    playerCompletedAction(id, clientRoundName, action, orderIndex, amount) {
        Game.logPlayerAction(
            'client sent un-validated action with parameters', id, clientRoundName, action, orderIndex, amount
        );

        const cur = this.dealer.actingPlayerState;

        if (!this.dealer.validateClientState(id, clientRoundName)) {
            Game.log(
                `error: client turn state doesnt match server:`,
                `server acting player id: ${cur.player.id}`,
                `server active round: ${this.activeRound.name}`,
                `client sent id: ${id}`,
                `client sent round: ${clientRoundName}`
            );
        }

        const curupdated = this.dealer.processPlayerAction(cur, action, clientRoundName, amount);
        const roundupdated = this.dealer.updateGameState(curupdated);

        Game.logPlayerState(
            curupdated,
            'current player'
        );
        Game.logPlayerAction(
            'validated action, updated parameters', id, clientRoundName, action, orderIndex, amount
        );
        Game.logRoundState(
            'round after player action validation',
            clientRoundName,
            roundupdated.name
        );

        if (curupdated.position.isAnchor) {
            switch (roundupdated.name) {
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

        clientRoundName = roundupdated.name;

        const next = this.dealer.findNextActivePlayerInHand(curupdated);
        const nextPlayerAllowedActions = this.dealer.getAllowedActionsForPlayer(next, clientRoundName);

        this.dealer.setPlayerStateAllowedActions(next, ...nextPlayerAllowedActions);

        next.isActingPlayer = true;

        Game.logDealerState(this.dealer);
        Game.logPlayerState(next, 'next player');

        this.gameEvent.emit(
            'pass-action-to-player',
            clientRoundName,
            next.position.seatIndex,
            next.position.betOrder,
            next.player.id,
            next.hasActed,
            this.dealer.pot.size,
            next.actions.owed(this.dealer.minBet, next.actions.betTotal),
            next.actions.allowed
        );
    }

    playerNameLookupBySeat(i) {
        return this.positions.find(([k, v]) => k === i)[1].player.name;
    }

    dealHolecards() {
        this.currentRound = 'deal';

        const dealt = new Map();

        for (const p of this.positions) {
            dealt.set(p[1].player.id, {
                a: null, b: null
            });
        }

        for (const p of this.positions) {
            dealt.get(p[1].player.id).a = this.deck.draw();
        }

        for (const p of this.positions) {
            dealt.get(p[1].player.id).b = this.deck.draw();
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

    static logPlayerState(player, message) {
        console.log('=== === === ===');
        console.log('**');
        console.log(`${message ? message : 'player data'}`);
        console.log('**');
        console.log(player);
        console.log('**');
        console.log('=== === === ===');
        console.log('\n');
    }

    static logDealerState(dealer, message) {
        const bets = dealer.activeRound.actions.bets;

        console.log('=== === === ===');
        console.log('**');
        console.log(`round and pot state for: ${dealer.activeRound.name}`)
        console.log('**');
        console.log(dealer.activeRound);
        console.log('*');
        console.log('total bet across all rounds')
        console.log(dealer.activeRound.actions.bets.total(bets.thisRound, bets.lastRound));
        console.log('*');
        console.log('**');
        console.log(dealer.pot)
        console.log('**');
        console.log('=== === === ===');
        console.log('\n');
    }
}

module.exports = Game;