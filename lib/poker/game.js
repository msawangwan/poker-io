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

            this.dealer.oneTimeInit(10);
            this.dealer.determineBettingOrder(this.positions, this.buttonPosition);
            this.dealer.toggleActingPlayer(null, 0);

            const sb = this.dealer.smallBlind;
            this.dealer.setAllowedActions(sb.id, true, 'postblind');

            this.gameEvent.emit(
                'pass-action-to-player',
                this.dealer.currentHandPhase,
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

    get playerCount() {
        return this.positions.length;
    };

    playerCompletedAction(id, round, type, orderIndex, amount) {
        Game.log(
            `player completed action`,
            `player id: ${id}`,
            `round: ${round}`,
            `type: ${type}`,
            `order index: ${orderIndex}`,
            `bet amount: ${amount}`
        );

        let next = null;
        let nextOrderIndex = this.dealer.nextOrderIndex(id);
        let nextPlayerAllowedActions = [];

        switch (round) {
            case 'blind':
                nextPlayerAllowedActions = this.dealer.handleBlind(id);
                // nextOrderIndex = this.dealer.handleBlind(id);
                next = this.dealer.toggleActingPlayer(orderIndex, nextOrderIndex);

                if (!next.isSmallBlind && !next.isBigBlind) {
                    this.dealer.currentHandPhase = 'deal';

                    this.gameEvent.emit(
                        'deal-holecards',
                        this.dealer.players,
                        this.dealHolecards()
                    );

                    // this.dealer.setAllowedActions(next.id, true, 'call', 'bet', 'raise', 'fold');
                } else {
                    // this.dealer.setAllowedActions(next.id, true, 'postblind');
                }

                this.dealer.setAllowedActions(next.id, true, ...nextPlayerAllowedActions)

                break;
            case 'deal':
                nextPlayerAllowedActions = this.dealer.handleBet(id, amount);
                // nextOrderIndex = this.dealer.handleBet(id);
                next = this.dealer.toggleActingPlayer(orderIndex, nextOrderIndex);

                if (next.isBetAnchor) {
                    Game.logPlayerData(next, 'bet anchor reached');
                } else {
                    // this.dealer.setAllowedActions(next.id, 'call', 'bet', 'raise', 'fold');
                }

                this.dealer.setAllowedActions(next.id, true, ...nextPlayerAllowedActions);

                break;
            default:
                break;
        }

        if (next === null) {
            Game.log(
                'warning: next is null'
            );
        }

        Game.logPlayerData(next, 'next player');

        this.gameEvent.emit(
            'pass-action-to-player',
            this.dealer.currentHandPhase,
            next.seatIndex,
            next.betOrder,
            next.id,
            next.hasActed,
            this.dealer.pot,
            this.dealer.minBet,
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

        {
            Game.log(`flop burn card: ${burn}`);
        }

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
}

module.exports = Game;