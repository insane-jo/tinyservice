const net = require('net');
const JsonSocket = require('json-socket');
const uuid = require('uuid');

class TinyServiceClient {
    constructor(opts) {
        if (!opts) {
            throw 'Options param must be passed to constructor';
        }

        let {host, port} = opts;
        if (!host || !port) {
            throw 'Host and Port properties must be specified!';
        }

        this._socket = new net.Socket();
        this._jsonSocket = new JsonSocket(this._socket);

        this._socket.connect(port, host);

        this._jsonSocket.on('message', (msg) => {
            this._onMessage(msg);
        });

        this._pendingAnswers = {};
    }

    _onMessage(msg) {

    }

    /**
     * Emits message to connected server
     * @param {!{}} pattern
     * @param {?Function} [callback]
     */
    act(pattern, callback) {
        let uid = uuid.v4();
        if (callback) {
            this._pendingAnswers[uid] = callback;
        }

        this._jsonSocket.sendMessage({
            uid: uid,
            data: pattern
        })
    }
}

module.exports = TinyServiceClient;