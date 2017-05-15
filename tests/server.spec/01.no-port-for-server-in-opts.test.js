const TinyServiceServer = require('../../server');
const DUMMY_PORT = (Math.random() * (65535 - 10000) + 10000)|0;

test('No options for server throws error', () => {
    let errorThrowed = false;
    try {
        let server = new TinyServiceServer();
        server.close();
    } catch(e) {
        errorThrowed = true;
    }

    expect(errorThrowed).toBe(true);
});

test('No port in options for server throws error', () => {
    let errorThrowed = false;
    try {
        let server = new TinyServiceServer({});
        server.close();
    } catch(e) {
        errorThrowed = true;
    }

    expect(errorThrowed).toBe(true);
});

test('Server with port creates normally', () => {
    let errorThrowed = false;
    try {
        let server = new TinyServiceServer({
            port: DUMMY_PORT
        });
        server.close();
    } catch(e) {
        errorThrowed = true;
    }

    expect(errorThrowed).toBe(false);
});