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

        this.dealer.currentHandPhase = 'none';

        Game.log('game created:', `game id: ${this.id}`, `button: ${this.buttonPosition}`);

        this.deck = new Deck();
        this.deck.shuffle(5);

        this.gameEvent = new GameEvent();

        this.gameEvent.once('game-start', (onstart) => {
            onstart(this.id);

            this.dealer.determineBettingOrder(this.positions, this.buttonPosition);
            this.dealer.toggleActingPlayer(null, 0);

            const sb = this.dealer.smallBlind;
            sb.allowedActions = ['postblind'];

            this.dealer.currentHandPhase = 'blind';
            this.dealer.currentBettingRound = 0;
            this.dealer.currentBetAnchor = sb.id;

            this.gameEvent.emit(
                'pass-action-to-player',
                this.dealer.currentHandPhase,
                sb.seatIndex,
                sb.betOrder,
                sb.id,
                sb.hasActed,
                this.dealer.pot,
                this.dealer.minbet.current,
                sb.allowedActions
            );
        });

        this.gameEvent.on('poll-game-state', (onsendstate) => {
            const acting = this.dealer.actingPlayer;
            const id = acting.id;
            const seat = acting.seatIndex;
            const name = this.playerNameLookupBySeat(seat);
            const handphase = this.dealer.currentHandPhase;
            const betround = this.dealer.currentBettingRound;
            const betanchor = this.dealer.currentBetAnchor;
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
            `playerid: ${id}`,
            `round: ${round}`,
            `type: ${type}`,
            `order index: ${orderIndex}`,
            `bet amount: ${amount}`
        );

        let next = null;
        let nextOrderIndex = -1;

        switch (round) {
            case 'blind':
                nextOrderIndex = this.dealer.handleBlind(id);

                this.dealer.toggleActingPlayer(orderIndex, nextOrderIndex);

                next = this.dealer.actingPlayer;

                if (!next.isSmallBlind && !next.isBigBlind) {
                    this.dealer.currentHandPhase = 'deal';

                    // todo: delay for animation

                    this.gameEvent.emit(
                        'deal-holecards',
                        this.dealer.players,
                        this.dealHolecards()
                    );

                    next.allowedActions = ['call', 'bet', 'raise', 'fold'];
                } else {
                    next.allowedActions = ['postblind'];
                }

                break;
            case 'deal':
                nextOrderIndex = this.dealer.handleBet(id);

                this.dealer.toggleActingPlayer(orderIndex, nextOrderIndex);

                next = this.dealer.actingPlayer;

                if (next.betOrder === this.dealer.betAnchorPosition) {
                    Game.log(
                        'reached bet anchor position',
                        `bet order position: ${this.dealer.betAnchorPosition}`
                    );
                }

                break;
            default:
                break;
        }

        if (next === null) {
            Game.log(
                'warning: next is null'
            );
        }

        Game.log(
            'next player:'
        );

        console.log(next);
        console.log('');

        this.gameEvent.emit(
            'pass-action-to-player',
            this.dealer.currentHandPhase,
            next.seatIndex,
            next.betOrder,
            next.id,
            next.hasActed,
            this.dealer.pot,
            this.dealer.minbet.current,
            next.allowedActions
        );
    }

    getBetAnchorPosIndexByRound(r) {
        return this.rounds.get(r).betAnchorPosition;
    }

    setBetAnchorPosIndexByRound(r, i) {
        this.rounds.get(r).betAnchorPosition = i;
    }

    getRoundCirculations(r) {
        return this.rounds.get(r).circulations;
    }

    increaseRoundCirculations(r) {
        this.rounds.get(r).circulations += 1;
    }

    nextInTurnOrderFromCurrentPosition() {
        return (this.actionPosition + 1) % this.playerCount;
    }

    playerPositionRelativeToButtonPosition(i) {
        return (this.buttonPosition + (i + 1)) % this.playerCount;
    }

    getPlayerBetHistoryById(i) {
        return this.bettingHistory.get(i);
    }

    getPlayerPotContributionById(i) {
        return this.bettingHistory.get(i).length ?
            this.bettingHistory.get(i).reduce((s, v) => s + v) : 0;
    }

    playerNameLookupBySeat(i) {
        return this.positions.find(([k, v]) => k === i)[1].player.name;
    }

    playerPlacedBet(id, b) {
        this.bettingHistory.get(id).push(b);
    }

    resetBets() {
        for (const [id, b] of this.bettingHistory) {
            b = [];
        }
    }

    printBetsToConsole() {
        for (const [id, b] of this.bettingHistory) {
            Game.log(`player bets: ${id}`);
            Game.log(b);
        }
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
}

module.exports = Game;