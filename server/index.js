const net = require('net');
const JsonSocket = require('json-socket');
const DeepCondition = require('deep-condition');
const EventEmitter = require('event-emitter-es6');
const uuid = require('uuid');

const CALLBACK_PROPERTY_NAME = Symbol('cb');

class TinyServiceServer {
    constructor(options) {
        if (!options) {
            throw 'Options for TinyServiceServer.constructor must be specified!';
        }

        let {port} = options;
        if (!port) {
            throw 'No port specified in options param in TinyServiceServer.constructor!';
        }

        /**
         * @type {Object<string, {callback: Function}>[]}
         * @private
         */
        this._eventTypes = [];

        this._server = net.createServer();
        this._server.listen(options.port);

        this._subscriptionHandlers = {};

        this._server.on('connection', (socket) => {
            socket = new JsonSocket(socket);

            socket.on('message',
                /**
                 * @param message
                 * @param {?string} message.uid
                 * @param {*} message.data
                 * @param {boolean} $subscription$
                 */
                (message) => {
                    this._onMessage(socket, message);
                }
            );
        });
    }

    _onMessage(socket, message) {
        let isSubscription = message['$subscription$'];

        if (isSubscription) {
            let systemMessage = message['$systemMessage$'];

            if (systemMessage === 'END') {
                this._handleUnsubscribe(socket, message);
            } else {
                this._handleSubscription(socket, message);
            }

        } else {

            this._handleSingleMessage(socket, message);

        }
    }

    _handleUnsubscribe(socket, message) {
        let {uid} = message;
        this._subscriptionHandlers[uid].forEach((cb) => cb());

        delete this._subscriptionHandlers[uid];
    }

    _handleSubscription(socket, message) {
        let {uid, data} = message;
        let foundActions = this._getActionsForMessage(data);

        this._subscriptionHandlers[uid] = [];

        foundActions.forEach((act) => {
            let addedUnsubscribe = false;

            act[CALLBACK_PROPERTY_NAME](data, (err, answer) => {
                if (!this._subscriptionHandlers[uid]) {
                    return console.warn('Emit message to closed subscription');
                }

                answer = {
                    uid: uid,
                    err,
                    data: err ? undefined : answer,
                    $subscription$: true
                };
                socket.sendMessage(answer);
            }, (cb) => {
                addedUnsubscribe = true;

                this._subscriptionHandlers[uid].push(cb);
            });

            if (!addedUnsubscribe) {
                throw 'Unsubscribe function must be registered syncronously!';
            }
        });
    }

    _handleSingleMessage(socket, message) {

        let {uid, data} = message;
        let foundActions = this._getActionsForMessage(data);

        Promise.all(
            foundActions.map((act) =>
                new Promise((resolve, reject) => {
                    act[CALLBACK_PROPERTY_NAME](data, (err, answer) => {
                        answer = {
                            uid: uid,
                            err,
                            data: err ? undefined : answer
                        };
                        socket.sendMessage(answer, () => {
                            resolve(true);
                        });
                    })
                })
            )
        ).then(() => {
            if (uid) {
                socket.sendMessage({
                    uid,
                    $systemMessage$: 'END'
                });
            }
        }).catch((err) => {
            console.error(err);
        });

    }

    /**
     * Return filtered actions for specified message
     * @param message
     * @returns {*}
     * @private
     */
    _getActionsForMessage(message) {
        let filters = Object.keys(message).map((key) => {
            return {
                logic: 'or',
                filters: [
                    {field: key, operator: 'eq', value: message[key]},
                    {field: key, operator: 'eq', value: undefined}
                ]
            }
        });

        return DeepCondition(this._eventTypes, filters).filter((act) => {
            let actionKeys = Object.keys(act);
            let commonProperties = actionKeys.reduce((res, key) => {
                if (act[key] === message[key]) {
                    res++;
                }
                return res;
            }, 0);

            // return true only if action pattern fully equals to analog properties in message
            return actionKeys.length === commonProperties;

        });
    }

    /**
     * Adds action handler to call stack
     * @param {!{}} pattern
     * @param {!Function} callback
     */
    add(pattern, callback) {
        if (!pattern || typeof pattern !== 'object') {
            throw 'Pattern must be an object';
        }

        if (typeof callback !== 'function') {
            throw 'call back must be a function';
        }

        this._eventTypes.push(
            Object.assign({}, pattern, {[CALLBACK_PROPERTY_NAME]: callback})
        );
    }

    /**
     * Removes action by pattern from actions handlers.
     * @param {!{}} pattern
     * @param {Function} [callback]
     * @param {boolean} [strict=true] if passed false - will be removed commonly patterns
     * @return {{}[]} array of removed action handlers
     */
    remove(pattern, callback, strict) {
        if (!pattern || typeof pattern !== 'object') {
            throw 'Pattern must be an object';
        }

        if (arguments.length === 1) {
            callback = null;
            strict = true;
        } else if (arguments.length === 2) {
            if (typeof arguments[1] === 'boolean') {
                strict = arguments[1];
                callback = null;
            } else {
                strict = true;
                callback = arguments[1];
            }
        }

        let filteredActions;

        if (strict) {
            //In strict - remove only pattern fully equals to action patter
            filteredActions = this._getActionsForMessage(pattern);

            filteredActions = filteredActions.filter((act) => {
                let resultKeys = Object.keys(act);
                Object.keys(pattern).forEach((key) => resultKeys.indexOf(key) === -1 ? resultKeys.push(key) : null);

                return resultKeys.filter((key) => {
                        return act.hasOwnProperty(key) && pattern.hasOwnProperty(key) && act[key] === pattern[key]
                    }).length === resultKeys.length;
            });
        } else {
            let filters = Object.keys(pattern).map((key) => {
                return {field: key, operator: 'eq', value: pattern[key]};
            });

            filteredActions = DeepCondition(this._eventTypes, filters);
        }

        if (callback) {
            filteredActions = filteredActions.filter((act) => act[CALLBACK_PROPERTY_NAME] === callback);
        }

        this._eventTypes = this._eventTypes.filter((act) => filteredActions.indexOf(act) === -1);

        return filteredActions;
    }

    _removeAllSubscriptions() {
        Object.keys(this._subscriptionHandlers)
            .forEach((key) => {
                this._subscriptionHandlers[key].forEach((cb) => cb());
            });

        this._subscriptionHandlers = {};
    }

    close() {
        this._removeAllSubscriptions();

        this._server.close();
        this._server.unref();
    }

    clear() {
        this._removeAllSubscriptions();

        this._eventTypes = [];
    }
}

module.exports = TinyServiceServer;