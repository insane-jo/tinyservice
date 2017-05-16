# tinyservice
A tiny and lightweight microservice framework, created for nodejs.
TinyService uses json-messages to exchange between server and client.

## Install

```bash
npm install tinyservice --save
```

## Server instance

Server instance of microservice, based on TCP-server.

### constructor
```javascript
const Server = require('tinyservice').Server;
const serverInstance = new Server({
    port: 11234
});
```
Parameters:
* `{Object} options` - required parameter to pass options to construct Server instance
* `{number} options.port` - required parameter. Port, on which will be listen server

### add
Adds handler to listen messages on server
Params:
* `{Object<string, number|string|boolean>} pattern` - pattern to handle messages on server side. If incoming messages matches pattern - handler will be called with this message.
* `{Function} handlerFunction` - function, that will be called if incomingMessage matches pattern. Function must accept two params:
  * `{Object} msg` - incoming message, that was received
  * `{Function} doneFunction` - function, that must be called after action was ended. Function receives two params - error and outgoing message. Error - if handler fails, Outgoing message - message to send to client as answer. **CALL OF doneFunction is required!**

Example:
```javascript
serverInstance.add({
    property1: 1,
    property2: 2
}, 
    /**
     * Handler function
     * @param {{}} incomingMessage
     * @param {Function} doneFunction
     */
    (incomingMessage, doneFunction) => {
        //...SOME ACTIONS...
        doneFunction(err, outgoingMessage);
    }
)
```

### remove
Removes handler by pattern.
* `{!Object} pattern` - required param. Pattern, on which you want to remove handler
* `[{Function} handler]` - optional parameter. If not passed - all handlers will be removed
* `[{boolean} strictMode = true]` - optional parameter. If passed `true` - will be removed only actions, that fully matches passed pattern. If passed `false` - will be removed common patterns.

Example:
```javascript
server.add({ // will be removed if strict and not strict mode
    a: 1,
    b: 2
}, () => {});

server.add({ // will be removed in non strict mode in this case
    a: 1
}, () => {});

server.remove({
    a: 1,
    b: 2
}/*, true or false */);
```

### close
Closes server instance and unrefs port

## Client instance
```javascript
const Client = require('tinyservice').Client;
const clientInstance = new Client({
    host: '127.0.0.1',
    port: 11234
});
```

### act
Emits message and handles answers from server
Params:
* `{!Object} pattern` - required parameter. Pattern to send message to server.
* `{Function} callback` - callback, that will be called, when server message will received by this call.
**EXAMPLE**
```javascript
serverInstance.add({
    a: 1,
    b: 2
}, (msg, done) => {
    done(null, {
        message: 'This message will be received by client!'
    })
});

serverInstance.add({
    a: 1
}, (msg, done) => {
    done(null, {
        message: 'This message will be received by client too!!!'
    })    
});

clientInstance.act({a: 1, b: 2}, (err, msg) => {
    //This function will be called two times
    //from both handlers on server
})
```

### close
Closes client instance