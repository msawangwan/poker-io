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
        ]);

        this.$betrangeslider = $('#bet-range-slider');

        this.$betrangeslider.on('change', () => {
            const val = this.$betrangeslider.val();

            if (this.callbackHandlers.get('bet-range-slider').size) {
                for (const [id, h] of this.callbackHandlers.get('bet-range-slider')) {
                    h(val);
                }
            }
        });
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