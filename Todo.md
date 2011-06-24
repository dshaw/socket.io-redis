External Storage / Redis Store
===============================

Patched
------------------

  -

Dispatch Events
------------------

  - parser.js
    * packets

Add to Store
------------------

  - manager.js
    ? namespaces
        - manager.js
        - Manager.prototype.of = function (namespace) {};
    ? enable/disable settings
  - namespace.js
    * SocketNamespace
      - this.sockets = {}
    * SocketNamespace.prototype.packet = function (packet) {};
  - socket.js
    * this.store.once('disconnect:' + id, function (reason) {};
    * Socket.prototype.packet = function (packet) {};
    * Socket.prototype.set = function (key, value, fn) {};
    * Socket.prototype.get = function (key, fn) {};
    * Socket.prototype.send = function (data, fn) {};
    * Socket.prototype.emit = function (ev) {};
  - transport.js
    * Transport.prototype.handleRequest = function (req) {};
      `this.store.publish`
    * Transport.prototype.setHandlers = function () {}
      - this.store.once('disconnect-force:' + this.id, function () {};
      - this.store.on('heartbeat-clear:' + this.id, function () {};
      - this.store.on('volatile:' + this.id, function (packet) {};
    * Transport.prototype.clearHandlers = function () {}
      - // probably can actually be ignored.


Handle listeners
------------------

  - manager.js
    * self.store.on('message:' + data.id, function (packet) { self.handlePacket(data.id, packet); });
  - namespace.js
    * SocketNamespace.prototype.handlePacket = function (sessid, packet) {};
