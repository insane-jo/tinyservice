const TinyServiceServer = require('../../server');
const DUMMY_PORT = (Math.random() * (65535 - 10000) + 10000)|0;

test('Filter actions by pattern', () => {
    let server = new TinyServiceServer({
        port: DUMMY_PORT
    });

    server.add({
        a: 1
    }, () => {});

    server.add({
        a: 1,
        b: 2
    }, () => {});

    server.add({
        a: 1,
        b: 2,
        c: 3
    }, () => {});

    server.add({
        b: 2,
        c: 3
    }, () => {});

    server.add({
        a: 1,
        c: 3
    }, () => {});

    server.close();

    let foundActions;

    foundActions = server._getActionsForMessage({a: 1});
    expect(foundActions.length).toBe(1);

    foundActions = server._getActionsForMessage({a: 1, b: 2});
    expect(foundActions.length).toBe(2);

    foundActions = server._getActionsForMessage({c: 3});
    expect(foundActions.length).toBe(0);
});