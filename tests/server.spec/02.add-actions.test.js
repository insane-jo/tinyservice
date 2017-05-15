const Server = require('../../server');
const DUMMY_PORT = (Math.random() * (65535 - 10000) + 10000)|0;

test('Throws error when no pattern specified or pattern not an object', () => {
    let server = new Server({port: DUMMY_PORT});
    let errorThrowed = 0;

    try {
        server.add(null, () => {});
    } catch(e) {
        errorThrowed++;
    }

    try {
        server.add('some not object pattern', () => {});
    } catch(e) {
        errorThrowed++;
    }

    try {
        server.add({}, () => {});
    } catch(e) {
        errorThrowed++;
    }

    try {
        server.add({pattern: true}, () => {});
    } catch(e) {
        errorThrowed++;
    }

    server.close();
    expect(errorThrowed).toBe(2);
});

test('Throws error when no handler function specified or not a function handler passed', () => {
    let server = new Server({port: DUMMY_PORT});
    let errorThrowed = 0;

    try {
        server.add({}, () => {});
    } catch(e) {
        errorThrowed++;
    }

    try {
        server.add({}, null);
    } catch(e) {
        errorThrowed++;
    }

    try {
        server.add({}, 'some pattern not a function');
    } catch(e) {
        errorThrowed++;
    }

    server.close();
    expect(errorThrowed).toBe(2);

});

test('Add multiple actions', () => {
    let server = new Server({port: DUMMY_PORT});

    server.add({}, () => {});
    server.add({}, () => {});
    server.add({}, () => {});

    server.close();
    expect(server._eventTypes.length).toBe(3);

});