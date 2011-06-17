/*!
 * Socket.IO Redis Store
 * Copyright(c) 2011 Daniel D. Shaw <dshaw@dshaw.com>
 * MIT Licenced
 */

/**
 * Module Dependencies
 */

var crypto = require('crypto')
  , util = require('util')
  , Store = require('socket.io').Store;

/**
 * Export the constructors
 */

exports = module.exports = RedisStore;
RedisStore.Client = Client;

/**
 * Redis Store
 *
 * @api public
 */

function RedisStore(opts) {
  this.clients = {};
  this.rooms = {};
  opts.namespace || (opts.namespace = 'socket.io');
  this.namespace = opts.namespace;
  this.opts = opts;
  this.redisClient = new redis.createClient(opts.port, opts.host, opts);
  this.redisSubscriber = new redis.createClient(opts.port, opts.host, opts);
  if (opts.db) {
    var self = this;
    self.redisClient.on('connect', function() {
      self.redisClient.select(opts.db);
    });
    self.redisSubscriber.on('connect', function() {
      self.redisSubscriber.select(opts.db);
    });
  }
}

/**
 * Inherits from Socket.IO Store
 */

util.inherits(RedisStore, Store);


/**
 * Namespaced keys.
 *
 * @param {String} key
 *
 * @api private
 */

Store.prototype.key = function (key /* , multi element key */) {
  return [this.namespace].concat(Array.prototype.slice.call(arguments)).join(':')
};

/**
 * Handshake a client.
 *
 * @param {Object} client request object
 * @param {Function} callback
 * @api public
 */

RedisStore.prototype.handshake = function (data, fn) {
  var id = this.generateId()
    , key = this.key('handshaken');
  this.redisClient.ssad(key, id, function(err, res) {
    fn && fn(null, id, res);
  });
  return this;
};

/**
 * Checks if a client is handshaken.
 *
 * @api public
 */

RedisStore.prototype.isHandshaken = function (id, fn) {
  var key = this.key('handshaken');
  this.redisClient.sismember(key, id, function(err, res) {
    fn(null, ~res);
  });
  return this;
};

/**
 * Generates a random id.
 *
 * @api private
 */

RedisStore.prototype.generateId = function () {
  var rand = String(Math.random() * Math.random() * Date.now());
  return crypto.createHash('md5').update(rand).digest('hex');
};

/**
 * Retrieves a client store instance.
 *
 * NOTE: this need to be differs from Memory store. Needs to be async.
 *
 * @api public
 */

RedisStore.prototype.client = function (id, fn) {
  var self = this
    , key = this.key('clients');
  this.redisClient.hget(key, id, function(err, res) {
    if (res) {
      var meta = JSON.parse(res)
        , client = new RedisStore.Client(self, meta);
      return fn && fn(client);
    } else {
      self.log.debug('initializing client store for', id);
      var meta = JSON.stringify({ id: id });
      self.redisClient.hset(key, id, meta, function(err, res) {
        var client = new RedisStore.Client(self, meta);
        fn && fn(client);
      });
    }
  });
  return this;
};

/**
 * Called when a client disconnects.
 *
 * @param {String} id
 * @param {Boolean} force
 * @param {String} reason
 *
 * @api public
 */

RedisStore.prototype.disconnect = function (id, force, reason) {
  var self = this;
  this.isHandshaken(id, function(err, handshaken) {
    if (handshaken) {
      self.log.debug('destroying dispatcher for', id);

      var handshakenKey = self.key('handshaken')
        , clientsKey = self.key('clients');

      self.redisClient.multi()
          .srem(handshakenKey, id)
          .hdel(clientsKey, id)
          .exec(function (err, replies) {});

      if (force) {
        self.publish('disconnect-force:' + id, reason);
      }
      self.publish('disconnect:' + id, reason);
    }
  });
  return this;
};

/**
 * Relays a heartbeat message.
 *
 * @param {String} id
 *
 * @api private
 */

RedisStore.prototype.heartbeat = function (id) {
  return this.publish('heartbeat-clear:' + id);
};

/**
 * Relays a packet
 *
 * @param {String} id
 * @param {Object} packet
 *
 * @api private
 */

RedisStore.prototype.message = function (id, packet) {
  return this.publish('message:' + id, packet);
};

/**
 * Returns client ids in a particular room
 *
 * @param {String} room
 * @param {Function} callback
 *
 * @api public
 */

RedisStore.prototype.clients = function (room, fn) {
  if ('function' == typeof room) {
    fn = room;
    room = '';
  }

  var key = this.key('rooms', room);
  this.redisClient.smembers(key, function(err, res) {
    fn && fn(res);
  });
};

/**
 * Joins a user to a room
 *
 * @param {String} sid
 * @param {String} room
 * @param {Function} callback
 *
 * @api private
 */

RedisStore.prototype.join = function (sid, room, fn) {
  var key = this.key('rooms', room);
  this.redisClient.sadd(key, sid, function(err, res) {
    fn && fn();
  });
  return this;
};

/**
 * Removes a user from a room
 *
 * @api private
 */

RedisStore.prototype.leave = function (sid, room, fn) {
  var key = this.key('rooms', room);
  this.redisClient.srem(key, sid, function(err, res) {
    fn && fn();
  });
  return this;
};

/**
 * Simple publish
 *
 * @param {String} ev
 * @param {Object} data
 * @param {Function} callback
 *
 * @api public
 */

RedisStore.prototype.publish = function (ev, data, fn) {
  if ('function' == typeof data) {
    fn = data;
    data = undefined;
  }
  this.redisClient.publish(ev, data);
  if (fn) fn();

  return this;
};

/**
 * Simple subscribe
 *
 * @param {String} channel
 * @param {Function} callback
 *
 * @api public
 */

RedisStore.prototype.subscribe = function (chn, fn) {
  var self = this;
  this.redisSubscriber.subscribe(chn);

  this.redisSubscriber.on('message', function (channel, data) {
    // emit on the channel name
    self.emit.apply(self, arguments);
  });
  this.on(chn, fn);

  return this;
};

/**
 * Simple unsubscribe
 *
 * @param {String} channel
 *
 * @api public
 */

RedisStore.prototype.unsubscribe = function (chn) {
  this.redisSubscriber.unsubscribe(chn);
};

/**
 * Client constructor
 *
 * @api private
 */

function Client () {
  RedisStore.Client.apply(this, arguments);
  this.reqs = 0;
  this.paused = true;
  this.rooms = {};
}

/**
 * Inherits from Store.Client
 */

util.inherits(Client, Store.Client);

/**
 * Counts transport requests.
 *
 * @param {Function} callback
 *
 * @api public
 */

Client.prototype.count = function (fn) {
  var key = this.key('client', this.id);
  this.store.redisClient.hincr(key, 'count', function(err, res) {
    fn(null, res);
  });
  return this;
};

/**
 * Sets up queue consumption
 *
 * @param {Function} callback
 *
 * @api public
 */

Client.prototype.consume = function (fn) {
  this.consumer = fn;
  this.paused = false;

  if (this.buffer.length) {
    fn(this.buffer, null);
    this.buffer = [];
  }

  return this;
};

/**
 * Publishes a message to be sent to the client.
 *
 * @String encoded message
 * @api public
 */

Client.prototype.publish = function (msg) {
  if (this.paused) {
    this.buffer.push(msg);
  } else {
    this.consumer(null, msg);
  }

  return this;
};

/**
 * Pauses the stream.
 *
 * @api public
 */

Client.prototype.pause = function () {
  this.paused = true;
  return this;
};

/**
 * Destroys the client.
 *
 * @api public
 */

Client.prototype.destroy = function () {
  this.buffer = null;
};

/**
 * Gets a key
 *
 * @param {String} key
 * @param {Function} callback
 *
 * @api public
 */

Client.prototype.get = function (key, fn) {
  var clientKey = this.key('client', this.id);
  this.store.redisClient.hget(clientKey, key, function(err, res) {
    fn && fn(null, res);
  });
  return this;
};

/**
 * Sets a key
 *
 * @param {String} key
 * @param {String} value
 * @param {Function} callback
 *
 * @api public
 */

Client.prototype.set = function (key, value, fn) {
  var clientKey = this.key('client', this.id);
  this.store.redisClient.hset(clientKey, key, value, function(err, res) {
    fn && fn(null);
  });
  return this;
};

/**
 * Emits a message incoming from client.
 *
 * TODO: this should probably publish to redis instead of emitting
 *
 * @param {String} message
 *
 * @api private
 */

Client.prototype.onMessage = function (msg) {
  this.store.emit('message:' + this.id, msg);
};