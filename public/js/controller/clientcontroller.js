class ClientController {
    constructor() {
        this.$btnsendbet = $('#btn-send-bet');
        this.$btnsendblind = $('#btn-send-blind');
        this.$btnsendcheck = $('#btn-send-check');
        this.$btnsendfold = $('#btn-send-fold');
        this.$btnsendcall = $('#btn-send-call');
        this.$btnsendraise = $('#btn-send-raise');

        this.$formbetrangeslider = $('#form-betting-slider');

        this.$toggledUi = [
            this.$btnsendbet,
            this.$btnsendblind,
            this.$btnsendcheck,
            this.$btnsendfold,
            this.$btnsendcall,
            this.$btnsendraise,
            this.$formbetrangeslider
        ];

        this.ids = {
            inactive: 'inactive'
        };

        this.callbackHandlers = new Map([
            ['bet-range-slider', new Map()],
            ['bet-range-slider-btn-minus', new Map()],
            ['bet-range-slider-btn-plus', new Map()]
        ]);

        this.$betrangeslider = $('#bet-range-slider');
        this.$betrangesliderbtnminus = $('#bet-range-slider-btn-minus');
        this.$betrangesliderbtnplus = $('#bet-range-slider-btn-plus');

        this.$betrangeslider.on('change', () => {
            const v = this.parseValue(this.$betrangeslider);

            if (this.callbackHandlers.get('bet-range-slider').size) {
                for (const [id, h] of this.callbackHandlers.get('bet-range-slider')) {
                    h(v);
                }
            }
        });

        this.$betrangesliderbtnminus.on('click', () => {
            const v = this.parseValue(this.$betrangeslider);

            if (this.callbackHandlers.get('bet-range-slider-btn-minus').size) {
                for (const [id, h] of this.callbackHandlers.get('bet-range-slider-btn-minus')) {
                    h(v);
                }
            }
        });

        this.$betrangesliderbtnplus.on('click', () => {
            const v = this.parseValue(this.$betrangeslider);

            if (this.callbackHandlers.get('bet-range-slider-btn-plus').size) {
                for (const [id, h] of this.callbackHandlers.get('bet-range-slider-btn-plus')) {
                    console.log('calling', id);
                    h(v);
                }
            }
        });
    }

    parseValue($e, isFloat) {
        return isFloat ? parseFloat($e.val()) : parseInt($e.val());
    }

    setActive($b) {
        const id = this.ids.inactive;

        if ($b.hasClass(id)) {
            $b.removeClass(id);
        } else {
            $b.addClass(id);
        }
    }

    setInactive($e) {
        const id = this.ids.inactive;

        if (!$e.hasClass(id)) {
            $e.addClass(id);
        }
    }

    deactiveGroup($r) {
        for (const $e of $r) {
            this.setInactive($e);
        }
    }

    activeGroup($r) {
        for (const $e of $r) {
            this.setActive($e);
        }
    }
}