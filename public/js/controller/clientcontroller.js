class ClientController {
    constructor() {
        this.$betrangeslider = $('#bet-range-slider');
        this.$bettextfield = $('#bet-amount-text-field');

        this.$btnsendbet = $('#btn-send-bet');
        this.$btnsendblind = $('#btn-send-blind');
        this.$btnsendcheck = $('#btn-send-check');
        this.$btnsendfold = $('#btn-send-fold');
        this.$btnsendcall = $('#btn-send-call');
        this.$btnsendraise = $('#btn-send-raise');

        this.$allbtns = [
            this.$btnsendbet,
            this.$btnsendblind,
            this.$btnsendcheck,
            this.$btnsendfold,
            this.$btnsendcall,
            this.$btnsendraise
        ];

        this.$ids = {
            hidebtn: '#hide-button'
        };
    }

    hideAllButtons() {
        for (const $b of this.$allbtns) {
            $b.toggle(this.$hidebtn);
        }
    }
}