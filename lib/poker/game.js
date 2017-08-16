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

            this.dealer.updateGameState(sb, 0);
            this.dealer.setPlayerStateAllowedActions(sb, 'postblind');

            this.gameEvent.emit(
                'pass-action-to-player',
                'blind',
                sb.position.seatIndex,
                sb.position.betOrder,
                sb.player.id,
                sb.player.hasActed,
                this.dealer.pot.size,
                this.dealer.pot.min,
                sb.bets.allowedActions
            );
        });

        this.gameEvent.on('poll-game-state', (onsendstate) => {
            const acting = this.dealer.actingPlayerState;
            const id = acting.player.id;
            const seat = acting.position.seatIndex;
            const name = this.playerNameLookupBySeat(seat);
            const round = this.dealer.activeRound.name;
            const roundsbet = this.dealer.activeRound.actionHistory.count;
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

    playerCompletedAction(id, roundName, action, orderIndex, amount) {
        Game.logPlayerAction(
            'client sent un-validated action with parameters', id, roundName, action, orderIndex, amount
        );

        const cur = this.dealer.actingPlayerState;

        if (!this.dealer.validateClientState(id, roundName)) {
            Game.log(
                `error: client turn state doesnt match server:`,
                `server acting player id: ${cur.player.id}`,
                `server active round: ${this.dealer.activeRound.name}`,
                `client sent id: ${id}`,
                `client sent round: ${roundName}`
            );
        }

        const curupdated = this.dealer.processPlayerAction(cur, action, roundName, amount);
        const roundupdated = this.dealer.updateGameState(curupdated, roundName === 'blind' ? 5 : this.dealer.minBet);

        // Game.logPlayerState(
        //     curupdated,
        //     'current player'
        // );
        Game.logPlayerAction(
            'validated action, updated parameters', id, roundName, action, orderIndex, amount
        );
        // Game.logRoundState(
        //     'round after player action validation',
        //     roundName,
        //     roundupdated.name
        // );

        Dealer.logPlayerState('updated current player', curupdated);
        Dealer.logRoundState('updated round', roundupdated);

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

        roundName = roundupdated.name;

        const next = this.dealer.findNextActivePlayerInHand(curupdated);
        const nextPlayerAllowedActions = this.dealer.getAllowedActionsForPlayer(next, this.dealer.minBet, roundName);

        next.player.hasBetAction = true;

        this.dealer.setPlayerStateAllowedActions(next, ...nextPlayerAllowedActions);

        Dealer.logPlayerState('next player to act, sending a packet', next);

        this.gameEvent.emit(
            'pass-action-to-player',
            roundName,
            next.position.seatIndex,
            next.position.betOrder,
            next.player.id,
            next.player.hasActedOnce,
            this.dealer.pot.size,
            Dealer.calcAmountOwedByPlayer(next, this.dealer.pot.bets.min),
            next.bets.allowedActions
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
}

module.exports = Game;