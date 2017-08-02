class ClientController {
    constructor() {
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

        this.callbackHandlers = new Map([
            ['bet-range-slider', new Map()],
        ]);

        this.$betrangeslider = $('#bet-range-slider');

        this.$betrangeslider.on('change', () => {
            const val = this.$betrangeslider.val();

            this.$bettextfield.val(val);

            if (this.callbackHandlers.get('bet-range-slider').size) {
                for (const [id, h] of this.callbackHandlers.get('bet-range-slider')) {
                    h(val);
                }
            }
        });
    }

    hideAllButtons() {
        for (const $b of this.$allbtns) {
            $b.toggle(this.$hidebtn);
        }
    }
}