const Hand = require('../hand');

console.log('TEST HAND 0');
{
    const testHand = {
        a: { suite: 0, value: 4 },
        b: { suite: 0, value: 3 }
    };

    const testBoard = [
        { suite: 2, value: 12 },
        { suite: 0, value: 8 },
        { suite: 0, value: 5 },
        { suite: 2, value: 3 },
        { suite: 0, value: 2 }
    ];

    const h = new Hand(testHand);
    const b = h.determine(testBoard);
    const str = h.handRankString(b);

    console.log("best", b, str);
    console.assert(str === 'flush', 'shoulda been a flush');
}

console.log('TEST HAND 1');
{
    const testHand1 = {
        a: { suite: 0, value: 4 },
        b: { suite: 0, value: 3 }
    };

    const testBoard1 = [
        { suite: 2, value: 12 },
        { suite: 0, value: 6 },
        { suite: 0, value: 5 },
        { suite: 2, value: 3 },
        { suite: 0, value: 2 }
    ];

    const h1 = new Hand(testHand1);
    const b1 = h1.determine(testBoard1);
    const str1 = h1.handRankString(b1);

    console.log("best", b1, str1);
    console.assert(str1 === 'straight-flush', 'shoulda been a straight flush');
}

console.log('TEST HAND 2');
{
    const testHand2 = {
        a: { suite: 1, value: 4 },
        b: { suite: 0, value: 3 }
    };

    const testBoard2 = [
        { suite: 2, value: 12 },
        { suite: 3, value: 6 },
        { suite: 0, value: 5 },
        { suite: 2, value: 3 },
        { suite: 0, value: 2 }
    ];

    const h2 = new Hand(testHand2);
    const b2 = h2.determine(testBoard2);
    const str2 = h2.handRankString(b2);

    console.log("best", b2, str2);
    console.assert(str2 === 'straight', 'shoulda been a straight');
}


console.log('TEST HAND 3');
{
    const testHand3 = {
        a: { suite: 1, value: 4 },
        b: { suite: 0, value: 4 }
    };

    const testBoard3 = [
        { suite: 2, value: 4 },
        { suite: 3, value: 4 },
        { suite: 0, value: 5 },
        { suite: 2, value: 3 },
        { suite: 1, value: 2 }
    ];

    const h3 = new Hand(testHand3);
    const b3 = h3.determine(testBoard3);
    const str3 = h3.handRankString(b3);

    console.log("best", b3, str3);
    console.assert(str3 === 'four-of-a-kind', 'shoulda been four of a kind');
}

console.log('TEST HAND 4');
{
    const testHand4 = {
        a: { suite: 1, value: 4 },
        b: { suite: 0, value: 4 }
    };

    const testBoard4 = [
        { suite: 2, value: 4 },
        { suite: 3, value: 4 },
        { suite: 0, value: 5 },
        { suite: 2, value: 3 },
        { suite: 1, value: 2 }
    ];

    const h4 = new Hand(testHand4);
    const hicard = h4.highCard(testBoard4);

    console.log("hicard", hicard);
    console.assert(hicard.value === 5, `expected 4 got ${hicard}`);
}