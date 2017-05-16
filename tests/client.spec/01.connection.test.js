const TinyService = require('../../index');
const DUMMY_PORT = (Math.random() * (65535 - 10000) + 10000)|0;

const server = new TinyService.Server({port: DUMMY_PORT});
let client;

beforeEach(() => {
    server.clear();
});

afterAll(() => {
    server.close();
    client.close();
});

test('Test connection', (done) => {
    client = new TinyService.Client({
        host: '127.0.0.1',
        port: DUMMY_PORT
    });

    client.on('connect', () => {
        done();
    });
});

test('Send message and receive answer', (done) => {
    server.add({
        a: 1
    }, (msg, sendMsg) => {
        sendMsg(null, {
            test: 1
        });
    });

    client.act({
        a: 1,
        b: 2
    }, (err, msg) => {
        expect(err).toBeNull();
        expect(msg).toHaveProperty('test', 1);
        done();
    });
});

test('Act with multiple patterns on server emits callback multiple times', (done) => {
    server.add({
        a: 1
    }, (msg, sendMsg) => {
        sendMsg(null, {
            test: 1
        });
    });

    server.add({
        a: 1,
        b: 2
    }, (msg, sendMsg) => {
        sendMsg(null, {
            test: 1
        });
    });

    let totalCalls = 0;

    client.act({
        a: 1,
        b: 2
    }, (err, msg) => {
        totalCalls++;
    });

    setTimeout(() => {
        expect(totalCalls).toBe(2);
        done();
    }, 500);
});

test('Unmatched pattern won\'t be called', (done) => {
    server.add({
        a: 1
    }, (msg, sendMsg) => {
        sendMsg(null, {
            test: 1
        });
    });

    server.add({
        a: 1,
        b: 2
    }, (msg, sendMsg) => {
        sendMsg(null, {
            test: 1
        });
    });

    server.add({
        a: 1,
        c: 2
    }, (msg, sendMsg) => {
        sendMsg(null, {
            test: 1
        });
    });

    let totalCalls = 0;

    client.act({
        a: 1,
        b: 2
    }, (err, msg) => {
        totalCalls++;
    });

    setTimeout(() => {
        expect(totalCalls).toBe(2);
        done();
    }, 500);
});

test('After all answers - callback removes from client', (done) => {
    server.add({
        a: 1
    }, (msg, sendMsg) => {
        sendMsg(null, {
            test: 1
        });
    });

    let totalCalls = 0;

    client.act({
        a: 1,
        b: 2
    }, (err, msg) => {
        totalCalls++;
    });

    setTimeout(() => {
        expect(totalCalls).toBe(1);
        expect(Object.keys(client._pendingAnswers)).toHaveLength(0);
        done();
    }, 500);
});