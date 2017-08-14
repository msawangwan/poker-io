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
            this.dealer.setupPlayerStates(this.positions, this.buttonPosition);
            // this.dealer.determineBettingOrder(this.positions, this.buttonPosition);
            // this.dealer.toggleActingPlayerByBetOrder(null, 0);
            this.dealer.toggleActiveRoundByName('start');

            const sb = this.dealer.smallBlind;

            if (sb.id === this.dealer.actingPlayer.id) {
                Game.log(
                    `small blind, aka starting player, id: ${sb.id}`
                );
            } else {
                Game.log(
                    `err: mismatched id for starting player, got ${sb.id} but expected ${this.dealer.actingPlayer.id}`
                );
            }
            this.dealer.setAllowedActions(sb.id, true, 'postblind');

            this.gameEvent.emit(
                'pass-action-to-player',
                'blind',
                sb.seatIndex,
                sb.betOrder,
                sb.id,
                sb.hasActed,
                this.dealer.pot,
                this.dealer.blindBetSize,
                sb.bet.allowedActions
            );
        });

        this.gameEvent.on('poll-game-state', (onsendstate) => {
            const acting = this.dealer.actingPlayer;
            const id = acting.id;
            const seat = acting.seatIndex;
            const name = this.playerNameLookupBySeat(seat);
            const handphase = this.dealer.currentHandPhase;
            const betround = this.dealer.currentBettingRound;
            const betanchor = this.dealer.betAnchorPlayer.id;
            const potsize = this.dealer.pot;

            Game.log(
                'game state update request',
                `hand phase: ${handphase}`,
                `bet round: ${betround}`,
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
                handphase: handphase,
                betround: betround,
                betanchor: betanchor,
                potsize: potsize,
                clear: false
            });
        });
    };

    playerCompletedAction(id, round, action, orderIndex, amount) {
        Game.log(
            `a player sent game action, need to validate...`,
            `player id: ${id}`,
            `round on client: ${round}`,
            `action completed: ${action}`,
            `turn order index: ${orderIndex}`,
            `bet action amount: ${amount}`
        );

        const cur = this.dealer.actingPlayer;

        if (cur.id !== id) {
            Game.log(
                `error: client sent id that doesnt match current game state:`,
                `server state current: ${cur.id}`,
                `client sent: ${id}`
            );
        }

        this.dealer.updatePlayerStateOnActionCompleted(cur, action, round, amount);

        switch (round) {
            case 'blind':
                const blindplayer = this.dealer.getStateByPlayerId(id);

                if (blindplayer.isSmallBlind) {
                    amount = this.blindBetSize * 0.5;
                } else if (blindplayer.isBigBlind) {
                    amount = this.blindBetSize;

                    this.dealer.toggleActiveRoundByName(round);

                    this.gameEvent.emit(
                        'deal-holecards',
                        this.dealer.players,
                        this.dealHolecards()
                    );
                }

                break;
            case 'deal':
                break;
            default:
                break;
        }

        const nextOrderIndex = this.dealer.nextOrderIndex(id);
        // const next = this.dealer.toggleActingPlayerByBetOrder(orderIndex, nextOrderIndex);
        const completedActionId = this.dealer.completeAction(id, action, round, amount);
        const nextPlayerAllowedActions = this.dealer.getAllowedActionsForPlayer(next, this.dealer.activeRound.name);

        this.dealer.setAllowedActions(next.id, true, ...nextPlayerAllowedActions);

        const current = this.dealer.getStateByPlayerId(id);
        const currentRound = this.dealer.activeRound;

        Game.logDealerState(this.dealer);
        Game.logPlayerData(current, 'current player');
        Game.logPlayerData(next, 'next player');

        this.gameEvent.emit(
            'pass-action-to-player',
            this.dealer.activeRound.name,
            next.seatIndex,
            next.betOrder,
            next.id,
            next.hasActed,
            this.dealer.pot,
            next.bet.owed(this.dealer.minBet, next.bet.total),
            next.bet.allowedActions
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

    static logPlayerData(player, message) {
        console.log('=== === === ===');
        console.log(`${message ? message : 'player data'}`);
        console.log('**');
        console.log(player);
        console.log('=== === === ===');
        console.log('\n');
    }

    static logDealerState(dealer, message) {
        console.log('=== === === ===');
        console.log(`round state for: ${dealer.activeRound.name}`)
        console.log(dealer.activeRound);
        console.log('=== === === ===');
        console.log('\n');
    }
}

module.exports = Game;