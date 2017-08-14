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
            this.dealer.cycleActiveRoundByName('start');

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
            const roundsbet = this.dealer.activeRound.numberOfBettingRounds;
            const betanchor = this.dealer.currentBetAnchorPlayerId;
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

    playerCompletedAction(id, round, action, orderIndex, amount) {
        Game.log(
            `validating player action ...`,
            `player id: ${id}`,
            `round on client: ${round}`,
            `action completed: ${action}`,
            `turn order index: ${orderIndex}`,
            `bet action amount: ${amount}`
        );

        const cur = this.dealer.actingPlayerState;
        const curround = this.dealer.activeRound;

        if (!this.dealer.validateTurnState(id, round)) {
            Game.log(
                `error: client turn state doesnt match server:`,
                `server acting player id: ${cur.player.id}`,
                `server active round: ${curround.name}`,
                `client sent id: ${id}`,
                `client sent round: ${round}`
            );
        }

        switch (round) {
            case 'blind':
                if (cur.position.isSmallBlind && amount !== this.blindBetSize * 0.5) {
                    Game.log("VALID BLIND SMALLL BETS");
                    amount = this.blindBetSize * 0.5;
                } else if (cur.position.isBigBlind && amount !== this.blindBetSize) {
                    Game.log("VALID BLIND BIGGER BETS");
                    amount = this.blindBetSize;
                }
                break;
            default:
                break;
        }

        const curupdated = this.dealer.updatePlayerStateOnActionCompleted(cur, action, round, amount);

        switch (round) {
            case 'blind':
                if (curupdated.position.isBigBlind) {
                    Game.log("DEAL THE FCKIN CARDS");
                    this.dealer.cycleActiveRoundByName(round);

                    this.gameEvent.emit(
                        'deal-holecards',
                        this.dealer.players,
                        this.dealHolecards()
                    );
                }
            default:
                break;
        }

        const curroundupdated = this.dealer.activeRound;

        round = curroundupdated.name;

        const next = curupdated.player.next;
        const nextPlayerAllowedActions = this.dealer.getAllowedActionsForPlayer(next, round);

        this.dealer.setPlayerStateAllowedActions(next, ...nextPlayerAllowedActions);

        next.isActingPlayer = true;

        Game.logDealerState(this.dealer);
        Game.logPlayerData(curupdated, 'current player');
        Game.logPlayerData(next, 'next player');

        this.gameEvent.emit(
            'pass-action-to-player',
            round,
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

    static logPlayerData(player, message) {
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
        console.log('=== === === ===');
        console.log('**');
        console.log(`round and pot state for: ${dealer.activeRound.name}`)
        console.log('**');
        console.log(dealer.activeRound);
        console.log('**');
        console.log(dealer.pot)
        console.log('**');
        console.log('=== === === ===');
        console.log('\n');
    }
}

module.exports = Game;