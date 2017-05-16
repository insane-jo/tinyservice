const net = require('net');
const JsonSocket = require('json-socket');
const uuid = require('uuid');
const EventEmitter = require('event-emitter-es6');

class TinyServiceClient extends EventEmitter {
    constructor(opts) {
        if (!opts) {
            throw 'Options param must be passed to constructor';
        }

        let {host, port} = opts;
        if (!host || !port) {
            throw 'Host and Port properties must be specified!';
        }

        super();

        this._socket = new net.Socket();

        this._socket.on('connect', (...args) => {
            this.emit('connect', ...args)
        });

        this._jsonSocket = new JsonSocket(this._socket);

        this._socket.connect(port, host);

        this._jsonSocket.on('message', (msg) => {
            this._onMessage(msg);
        });

        this._pendingAnswers = {};
    }

    _onMessage(msg) {
        let {uid} = msg;

        if (uid) {
            let systemMessage = msg['$systemMessage$'];
            if (systemMessage) {
                if (systemMessage === 'END' && uid in this._pendingAnswers) {
                    delete this._pendingAnswers[uid];
                }
            } else {
                let {err, data} = msg;

                this._pendingAnswers[uid](err,data);
            }
        }
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

    close() {
        this._socket.close();
        this._socket.unref();
    }
}

module.exports = TinyServiceClient;