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

        this.rounds.get('blind').betAnchorPosition = 0;
        this.rounds.get('deal').betAnchorPosition = 1;
        this.rounds.get('flop').betAnchorPosition = 0;
        this.rounds.get('turn').betAnchorPosition = 0;
        this.rounds.get('river').betAnchorPosition = 0;

        this.currentRound = null;

        this.bettingHistory = new Map();

        this.deck = new Deck();
        this.deck.shuffle(5);

        this.potsize = 0;
        this.minbet = 10;

        this.currentminbet = {
            pid: null,
            size: this.minbet
        };

        this.gameEvent = new GameEvent();

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

            const bets = this.getPlayerBetHistoryById(playerid);
            const nextPosToAct = this.nextInTurnOrderFromCurrentPosition();

            let clearTable = false;

            this.potsize += bet;
            this.playerPlacedBet(playerid, bet);

            const blindId = this.actingOrderByPos.get(nextPosToAct);

            if (nextPosToAct === 1) {
                this.gameEvent.emit('collect-blind', blindId, 'bb', this.minbet);
            } else {
                this.gameEvent.emit('deal-holecards', blindId, this.minbet, this.dealHolecards()); // this.currentRound = 'deal';
            }

            this.actionPosition = nextPosToAct;

            onnotify(playerid, bet, this.potsize, clearTable);
        });

        /* scenario:
            - if (anchor bet - left of anchor) === 0
                - then anchor can check, bet, raise
        */

        this.gameEvent.on('player-posted-ante', (playerid, performedAction, betPlaced, onnotify) => {
            this.potsize += betPlaced;

            const playerPosIndex = this.actingOrderById.get(playerid);
            const betAnchorPosIndex = this.getBetAnchorPosIndexByRound('deal');

            Game.log(
                `${playerid} posted ante: ${betPlaced}`,
                `position index: ${playerPosIndex}`,
                `action: ${performedAction}`,
                `potsize: ${this.potsize}`,
                `min ante: ${this.minbet}`,
                `current min bet: ${this.currentminbet.size}`,
                `current anchor position index: ${betAnchorPosIndex}`
            );

            if (betAnchorPosIndex === playerPosIndex) {
                Game.log(
                    `action has circled back to the bet anchor position`,
                    `bet anchor index: ${betAnchorPosIndex} `,
                    `player pos index: ${playerPosIndex}`
                );
            }

            if (betPlaced > this.currentminbet.size) {
                const newAnchor = playerPosIndex;

                Game.log(
                    `${playerid} just set the min ante amount: ${betPlaced}`,
                    `the anchor position is now at seat ${newAnchor}`
                );

                this.rounds.get('deal').betAnchorPosition = newAnchor;

                this.currentminbet.size = betPlaced;
                this.currentminbet.pid = playerid;
            }

            const deltaBet = Math.abs(this.currentminbet.size - betPlaced);

            console.log("THIS IS THE BET DELTA X " + deltaBet);

            const allowedCounterActions = [];

            const previousBets = this.getPlayerBetHistoryById(playerid);
            const betsumPrior = this.getPlayerPotContributionById(playerid);

            if (betsumPrior < this.currentminbet.size) { // ex: prior was 0 and min bet is 10, then we owe 10 to play
                Game.log(`sum prior ${betsumPrior} current bet size ${this.currentminbet.size}`)
            }

            let nextBetMin = betPlaced < this.currentminbet.size ?
                this.currentminbet.size : betPlaced;

            if (previousBets.length) {
                nextBetMin = Math.abs(previousBets[previousBets.length - 1] - betPlaced);
            }

            this.playerPlacedBet(playerid, betPlaced);

            const currentBets = this.getPlayerBetHistoryById(playerid);
            const betsumCurrent = this.getPlayerPotContributionById(playerid);

            Game.log(`bet sums`, `prior ${betsumPrior}`, ` curr ${betsumCurrent}`);

            const nextPosToAct = this.nextInTurnOrderFromCurrentPosition();
            const nextToActId = this.actingOrderByPos.get(nextPosToAct);

            const currentRound = this.currentRound;
            const allowedActions = [];

            let numcirc = this.rounds.get(currentRound).circulations;
            let clearTable = false;

            allowedActions.push(
                nextBetMin > 0 ? 'call' : 'check',
                'fold'
            );

            if (numcirc < 3) {
                allowedActions.push(performedAction === 'raise' ? 're-raise' : 'raise');
            }

            let drawflop = false;

            if ((nextPosToAct - 1) == 1) {
                numcirc += 1;

                if (numcirc > 3) {
                    drawflop = true;
                }
            }

            this.rounds.get(currentRound).circulations = numcirc;

            if (drawflop) {
                this.gameEvent.emit('deal-flop', this.minbet, this.dealFlop()); // this.currentRound = 'flop';
            } else {
                this.gameEvent.emit('collect-ante', nextToActId, allowedActions, nextBetMin);
            }

            this.actionPosition = nextPosToAct;

            onnotify(playerid, betPlaced, this.potsize, clearTable);
        });
    };

    get playerCount() {
        return this.positions.length;
    };

    getBetAnchorPosIndexByRound(r) {
        return this.rounds.get(r).betAnchorPosition;
    }

    setBetAnchorPosIndexByRound(r, i) {
        this.rounds.get(r).betAnchorPosition = i;
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