const guestNameDb = new Set();

class Util {
    static assignGuestName() {
        const generate = () => `player ${Math.floor(Math.random() * 100)}`;

        do {
            let n = generate();

            if (!guestNameDb.has(n)) {
                guestNameDb.add(n);
                return n;
            }

            n = generate();
        } while (true);
    };
}

module.exports = Util;