const TinyService = require('../../index');
const DUMMY_PORT = (Math.random() * (65535 - 10000) + 10000) | 0;

let server = new TinyService.Server({
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

        registerUnsubscribe(() => {
        });
    });

    let client = new TinyService.Client({
        host: '127.0.0.1',
        port: DUMMY_PORT
    });

    let totalCalledCount = 0;

    client.subscribe({a: 1}, () => {
        totalCalledCount++;
    });

    setTimeout(() => {
        expect(totalCalledCount).toBe(3);
        done();
        client.close();
    }, 500);
});

test('On unsubscribe - server removes handler for this subscription', (done) => {
    (new Promise(function (resolve) {
        let totalCalledCount = 0;

        server.add({
            a: 1
        }, (msg, done, registerUnsubscribe) => {
            setTimeout(() => done(null, {}), 100);
            setTimeout(() => done(null, {}), 200);
            setTimeout(() => {
                done(null, {});
                setTimeout(() => {
                    resolve(totalCalledCount)
                }, 100);
            }, 300);

            registerUnsubscribe(() => {
            });
        });

        let client = new TinyService.Client({
            host: '127.0.0.1',
            port: DUMMY_PORT
        });

        client.subscribe({a: 1}, () => {
            totalCalledCount++;
            if (totalCalledCount === 2) {
                client.unsubscribe({a: 1});
            }
        });

        // setTimeout(() => {
        //     expect(totalCalledCount).toBe(2);
        //     done();
        //     client.close();
        // }, 500);
    })).then(function (totalCalledCount) {
        expect(totalCalledCount).toBe(2);
        done();
    }).catch((e) => {
        debugger
    });
});

test('When calling clear on server instance - all handlers and subscriptions removes', (done) => {

});