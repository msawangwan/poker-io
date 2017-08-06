const Action = require('./action');
const Round = require('./round');
const Turn = require('./turn');
const Table = require('./table');
const Deck = require('./deck');
const Card = require('./card');
const EventEmitter = require('events');


class GameEvent extends EventEmitter { }

class Game {
    constructor(id, positions, buttonPosition) {
        this.id = id;

        this.actionPosition = 0;
        this.buttonPosition = buttonPosition;
        this.positions = positions;

        Game.log('game created:', `game id: ${this.id}`, `button: ${this.buttonPosition}`);

        this.playersById = new Map();
        this.playerSeatIndiciesById = new Map();
        this.actingOrderById = new Map();
        this.actingOrderByPos = new Map();

        this.rounds = new Map([
            ['blind', new Round('blind')],
            ['deal', new Round('deal')],
            ['flop', new Round('flop')],
            ['turn', new Round('turn')],
            ['river', new Round('river')],
        ]);

        this.currentRound = null;

        this.deck = new Deck();
        this.deck.shuffle(5);

        this.potsize = 0;
        this.minbet = 10;

        this.bettingHistory = new Map();

        this.gameEvent = new GameEvent();

        /* when raised, the minbet changes to the last bet */

        this.gameEvent.once('game-start', (onstart) => {
            Game.log('game start', '- register turn order', '- notify seated players');

            this.currentRound = 'blind';

            for (let i = 0; i < this.playerCount; i++) {
                let j = this.playerPositionRelativeToButtonPosition(i);
                let id = this.positions[i][1].player.id;

                this.actingOrderById.set(id, j);
                this.actingOrderByPos.set(j, id);

                onstart(id, this.id);
            }

            for (const s of this.positions) {
                const id = s[1].player.id;
                this.playersById.set(id, s[1].player);
                this.playerSeatIndiciesById.set(id, s[1].seatindex);
                this.bettingHistory.set(id, []);
            }

            Game.log('turn order by id');
            console.log(this.actingOrderById);
            Game.log('turn order by pos');
            console.log(this.actingOrderByPos);
            Game.log('player by id');
            console.log(this.playersById);
            Game.log('seat indicies by id');
            console.log(this.playerSeatIndiciesById);
            Game.log('betting history');
            console.log(this.bettingHistory);

            this.actionPosition = 0;

            const sbId = this.actingOrderByPos.get(this.actionPosition);

            Game.log('small blind player id:', sbId);

            this.gameEvent.emit('collect-blind', sbId, 'sb', this.minbet);
        });

        this.gameEvent.on('poll-game-state', (onsendstate) => {
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

            onsendstate(seat, name, id, this.currentRound, info.circulations, this.potsize, false);
        });

        this.gameEvent.on('player-posted-blind', (playerid, performedAction, bet, onnotify) => {
            Game.log(
                `${playerid} posted blind`,
                `blind type ${performedAction}`
            );

            const bets = this.playerBetHistory(playerid);

            let clearTable = false;

            this.potsize += bet;
            this.playerPlacedBet(playerid, bet);
            this.printBetsToConsole();
            this.actionPosition = this.playerPositionNext();

            const blindId = this.actingOrderByPos.get(this.actionPosition);

            if (this.actionPosition === 1) {
                this.gameEvent.emit('collect-blind', blindId, 'bb', this.minbet);
            } else {
                this.gameEvent.emit('deal-holecards', blindId, this.minbet, this.dealHolecards()); // this.currentRound = 'deal';
            }

            onnotify(playerid, bet, this.potsize, clearTable);
        });

        this.gameEvent.on('player-posted-ante', (playerid, performedAction, bet, onnotify) => {
            Game.log(
                `${playerid} posted ante: ${bet}`,
                `performed action: ${performedAction}`
            );

            const nextbetmin = bet < this.minbet ? this.minbet : bet;
            const bets = this.playerBetHistory(playerid);
            const currentRound = this.currentRound;

            this.potsize += bet;
            this.playerPlacedBet(playerid, bet);
            this.printBetsToConsole();
            this.actionPosition = this.playerPositionNext();

            const nextToActId = this.actingOrderByPos.get(this.actionPosition);

            let numcirc = this.rounds.get(currentRound).circulations;
            let allowedActions = [];
            let clearTable = false;

            if (performedAction === 'raise') {
                allowedActions.push('call', 'fold');
                if (numcirc < 3) {
                    allowedActions.push('raise');
                }
            } else {
                allowedActions.push('call', 'raise', 'fold');
            }

            const justActedPos = this.actionPosition - 1;

            if (justActedPos == 1) {
                numcirc += 1;

                if (numcirc > 3) {
                    this.gameEvent.emit('deal-flop', this.minbet, this.dealFlop()); // this.currentRound = 'flop';
                }
            }

            this.rounds.get(currentRound).circulations = numcirc;


            this.gameEvent.emit('collect-ante', nextToActId, allowedActions, nextbetmin);

            onnotify(playerid, bet, this.potsize, clearTable);

            // if (justActedPos === 1) {
            //     numcirc += 1;

            //     if (performedAction === 'raise') {
            //         allowedActions.push(call);
            //         if (numcirc < 3) {
            //             allowedActions.push(raise);
            //         }
            //     } else {
            //         this.gameEvent.emit('deal-flop', this.minbet, this.dealFlop()); // this.currentRound = 'flop';
            //     }
            // } else {

            // }

            // this.gameEvent.emit('collect-ante', nextToActId, 'call', nextbetmin);

            // this.rounds.get(currentRound).circulations = numcirc;

            // if (justActedPos === 1) {
            //     numcirc += 1;

            //     if (numcirc < 3 && performedAction === 'raise') {
            //         this.gameEvent.emit('collect-ante', nextToActId, 'raise', nextbetmin);
            //     } else {
            //         nextaction = 'deal-flop';
            //         this.gameEvent.emit('deal-flop', this.minbet, this.dealFlop());

            //         clearTable = true;

            //         this.actionPosition = 0;
            //     }
            // } else {
            //     if (this.rounds.get(this.currentRound).circulations < 2) {
            //         if (action.type === 'raise') {
            //             this.gameEvent.emit('collect-ante', nextToActId, 'raise', nextbetmin);
            //         } else {
            //             this.gameEvent.emit('collect-ante', nextToActId, 'call', nextbetmin);
            //         }
            //     } else {
            //         this.gameEvent.emit('collect-ante', nextToActId, 'call', nextbetmin);
            //     }
            // }
        });
    };

    get playerCount() {
        return this.positions.length;
    };

    playerPositionNext() {
        return (this.actionPosition + 1) % this.playerCount;
    }

    playerPositionRelativeToButtonPosition(i) {
        return (this.buttonPosition + (i + 1)) % this.playerCount;
    }

    playerBetHistory(i) {
        return this.bettingHistory.get(i);
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