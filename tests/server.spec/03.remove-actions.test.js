const Server = require('../../server');
const DUMMY_PORT = (Math.random() * (65535 - 10000) + 10000)|0;

const server = new Server({
    port: DUMMY_PORT
});

beforeEach(() => {
    server.clear();
});

afterAll(() => {
    server.close();
});

const fillupServerActions = (server) => {
    let callbacks = [];
    let cb;

    cb = () => {};
    callbacks.push(cb);
    server.add({
        pattern: 'some pattern'
    }, cb);

    cb = () => {};
    callbacks.push(cb);
    server.add({
        pattern: 'some pattern',
        subpattern: 1
    }, cb);

    cb = () => {};
    callbacks.push(cb);
    server.add({
        pattern: 'another pattern'
    }, cb);

    cb = () => {};
    callbacks.push(cb);
    server.add({
        pattern: 'another pattern',
        subpattern: 1
    }, cb);

    return callbacks;
};

test('Remove pattern without passing any function in strict mode', () => {
    // let server = new Server({
    //     port: DUMMY_PORT
    // });

    fillupServerActions(server);

    let removedActions = server.remove({
        pattern: 'some pattern'
    });

    expect(removedActions.length).toBe(1);
    expect(server._eventTypes.length).toBe(3);

});

test('Remove pattern without passing any function not in strict mode', () => {
    // let server = new Server({
    //     port: DUMMY_PORT
    // });

    fillupServerActions(server);

    let removedActions = server.remove({
        pattern: 'some pattern'
    }, false);

    expect(removedActions.length).toBe(2);
    expect(server._eventTypes.length).toBe(2);

});

test('Remove pattern with passing function in strict mode', () => {
    // let server = new Server({
    //     port: DUMMY_PORT
    // });

    let callbacks = fillupServerActions(server);

    let removedActions = server.remove({
        pattern: 'some pattern'
    }, callbacks[0]);

    expect(removedActions.length).toBe(1);
    expect(server._eventTypes.length).toBe(3);

});

test('Remove pattern with passing function not in strict mode', () => {
    // let server = new Server({
    //     port: DUMMY_PORT
    // });

    let callbacks = fillupServerActions(server);

    let removedActions = server.remove({
        pattern: 'some pattern'
    }, callbacks[0], false);

    expect(removedActions.length).toBe(1);
    expect(server._eventTypes.length).toBe(3);

});