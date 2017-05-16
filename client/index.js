const net = require('net');
const JsonSocket = require('json-socket');
const uuid = require('uuid');
const EventEmitter = require('event-emitter-es6');
const equal = require('deep-equal');

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
            this._onConnect(...args);
            this.emit('connect', ...args);
        });

        this._socket.on('end', (...args) => {
            this._onEnd(...args);
            this.emit('end', ...args);
        });

        this._socket.on('timeout', (...args) => {
            this._onTimeout(...args);
            this.emit('timeout', ...args);
        });

        this._socket.on('close', (...args) => {
            this._onClose(...args);
            this.emit('close', ...args);
        });

        this._jsonSocket = new JsonSocket(this._socket);

        this._socket.connect(port, host);

        this._jsonSocket.on('message', (msg) => {
            this._onMessage(msg);
        });

        this._pendingAnswers = {};
        this._subscriptions = {};
    }

    _onConnect() {

    }

    _onEnd() {

    }

    _onTimeout() {

    }

    _onClose() {

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

                let subscription = msg['$subscription$'];
                if (subscription) {
                    this._subscriptions[uid].handler(err, data);
                } else {
                    this._pendingAnswers[uid](err, data);
                }
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

    /**
     * Subscribes for messages from server. For unsubscribe use TinyServiceClient.unsubscribe
     * @param {{}} msg
     * @param {Function} handler
     */
    subscribe(msg, handler) {
        var uid = uuid.v4();

        this._subscriptions[uid] = {
            msg,
            handler
        };

        this._jsonSocket.sendMessage({
            uid,
            data: msg,
            $subscription$: true
        });
    }

    unsubscribe(msg, handler, strictMode = true) {
        Object
            .keys(this._subscriptions)
            .filter((key) => equal(msg, this._subscriptions[key]))
            .forEach((uid) => {

                this._jsonSocket.sendMessage({
                    uid,
                    $systemMessage$: 'END',
                    $subscription$: true
                });

                delete this._subscriptions[uid];
            });
    }

    close() {
        this._socket.close();
        this._socket.unref();
    }
}

module.exports = TinyServiceClient;