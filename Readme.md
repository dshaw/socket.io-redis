Redis Implementation of Socket.IO Store
=======================================

Status: work in progress

So far the biggest breaking change is that I've encounter is that `Store.prototype.client` needs to return the client in a callback.

Testing
--------

You need to `npm link` in socket.io@0.7.0.

    cd [socket.io-node]
    npm link
    cd [socket.io-redis]
    npm link socket.io
