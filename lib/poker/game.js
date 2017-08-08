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

        Game.log('game created:', `game id: ${this.id}`, `button: ${this.buttonPosition}`);

        this.deck = new Deck();
        this.deck.shuffle(5);

        this.gameEvent = new GameEvent();

        this.gameEvent.once('game-start', (onstart) => {
            onstart(this.id);

            this.dealer.determineBettingOrder(this.positions, this.buttonPosition);
            this.dealer.toggleActingPlayer(null, 0);

            const sb = this.dealer.smallBlind;

            this.gameEvent.emit(
                'pass-action-to-player',
                'blind',
                sb[0],
                sb[1].betOrder,
                sb[1].id,
                sb[1].hasActed,
                this.dealer.pot,
                this.dealer.minbet.current,
                this.dealer.allowedActions
            );
        });

        // TODO HERE LEFT OFF
        this.gameEvent.on('poll-game-state', (onsendstate) => {
            const acting = this.dealer.actingPlayer;

            const id = acting[1].id;
            const seat = acting[0];

            const id = this.actingOrderByPos.get(this.actionPosition);
            const seat = this.playerSeatIndiciesById.get(id);
            const name = this.playersById.get(id).name;
            const info = this.rounds.get(this.currentRound);

            Game.log(
                'game state update request',
                `current round: ${this.currentRound}`,
                `num circulations: ${info.circulations}`,
                `current turn seat: ${seat}`,
                `current turn name: ${name}`,
                `current turn id: ${id}`
            );

            onsendstate(
                seat,
                name,
                id,
                this.currentRound,
                info.circulations,
                this.potsize,
                false
            );
        });
    };

    get playerCount() {
        return this.positions.length;
    };

    playerCompletedAction(id, round, type, order, amount) {
        let next = null;

        switch (round) {
            case 'blind':
                this.dealer.handleBlind(id);
                next = this.dealer.bigBlind;
                if (next[1].hasActed) {
                    round = 'deal';
                }
                break;
            default:
                break;
        }

        if (next === null) {
            next = this.dealer.passActionToNextPlayer(order);
        }

        this.gameEvent.emit(
            'pass-action-to-player',
            round,
            next[0],
            next[1].betOrder,
            next[1].id,
            next[1].hasActed,
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