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
            this.dealer.currentHandPhase = 'blind';
            this.dealer.currentBettingRound = 0;
            this.dealer.currentBetAnchor = 1;

            const sb = this.dealer.smallBlind;

            this.gameEvent.emit(
                'pass-action-to-player',
                this.dealer.currentHandPhase,
                // sb[0],
                // sb[1].betOrder,
                // sb[1].id,
                // sb[1].hasActed,
                sb.seatIndex,
                sb.betOrder,
                sb.id,
                sb.hasActed,
                this.dealer.pot,
                this.dealer.minbet.current,
                this.dealer.allowedActions
            );
        });

        this.gameEvent.on('poll-game-state', (onsendstate) => {
            const acting = this.dealer.actingPlayer;
            // const id = acting[1].id;
            // const seat = acting[0];
            const id = acting.id;
            const seat = acting.seatIndex;
            const name = this.playerNameLookupBySeat(seat);
            // const name = this.positions.find(([k, v]) => v.seatindex === seat)[1].player.name;
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

    playerCompletedAction(id, round, type, order, amount) {
        Game.log(
            `player completed action`,
            `playerid: ${id}`,
            `round: ${round}`,
            `type: ${type}`,
            `order: ${order}`,
            `bet amount: ${amount}`
        );

        let next = null;

        switch (round) {
            case 'blind':
                this.dealer.handleBlind(id);

                const bb = this.dealer.bigBlind;

                if (id === bb.id) {
                    if (bb.hasActed) {
                        round = 'deal';

                        next = this.dealer.getNextPlayerByPrevious(bb);

                        this.dealer.toggleActingPlayer(bb.betOrder, next.betOrder);

                        this.gameEvent.emit(
                            'deal-holecards',
                            this.dealer.players,
                            this.dealHolecards()
                        );
                    }
                } else {
                    next = bb;
                }

                break;
            case 'deal':
                const cur = this.dealer.actingPlayer();

                if (id === cur.id) {
                    if (cur.hasActed) {
                        next = this.dealer.getNextPlayerByPrevious(cur);

                        this.dealer.toggleActingPlayer(cur.betOrder, next.betOrder);
                    }
                } else {
                    next = cur;
                }
                // next = this.dealer.actingPlayer();
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

        this.gameEvent.emit(
            'pass-action-to-player',
            round,
            next.seatIndex,
            next.betOrder,
            next.id,
            next.hasActed,
            this.dealer.pot,
            this.dealer.minbet.current,
            this.dealer.allowedActions
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