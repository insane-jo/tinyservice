const TinyService = require('../../index');
const DUMMY_PORT = (Math.random() * (65535 - 10000) + 10000)|0;

let server = new TinyService.Server({
    port: DUMMY_PORT
});

let client = new TinyService.Client({
    host: '127.0.0.1',
    port: DUMMY_PORT
});

afterAll(() => {
    server.close();
});

beforeEach(() => {
    server.clear();
});

test('Subscriptions emits multiple times, unless called unsubscribe', (done) => {
    server.add({
        a: 1
    }, (msg, done, registerUnsubscribe) => {
        setTimeout(() => done(null, {}), 1);
        setTimeout(() => done(null, {}), 2);
        setTimeout(() => done(null, {}), 3);

        registerUnsubscribe(() => {});
    });

    let totalCalledCount = 0;

    client.subscribe({a: 1}, () => {
        totalCalledCount++;
    });

    setTimeout(() => {
        expect(totalCalledCount).toBe(3);
        done();
    }, 500);
});

test('On unsubscribe - server removes handler for this subscription', (done) => {

});

test('When calling clear on server instance - all handlers and subscriptions removes', (done) => {

});