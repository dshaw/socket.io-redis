/*!
 * Socket.IO Redis Store
 * Copyright(c) 2011 Daniel D. Shaw <dshaw@dshaw.com>
 * MIT Licenced
 */

/**
 * Module Dependencies
 */

var sio = require('socket.io') // npm link socket.io@v0.7.0
  , parser = sio.parser
  , RedisStore = require('..')
  , should = require('./common')
  , HTTPClient = should.HTTPClient;

/**
 * Configuration
 */

var ports = 15500
  , opts = { namespace: 'test:socket.io' };

/**
 * Test.
 */

module.exports = {

  'redisStore is an Instance of Socket.IO Store': function (done) {
    var Store = sio.Store
      , redisStore = new RedisStore(opts);

    redisStore.should.be.an.instanceof(Store);
    redisStore.should.be.an.instanceof(RedisStore);

    done();
  },

  // from socket.io manager.test.js
  'test handshake': function (done) {
    var port = ++ports
      , cl = client(port)
      , io = create(cl);

    cl.get('/socket.io/{protocol}/', function (res, data) {
      res.statusCode.should.eql(200);
      data.should.match(/([^:]+):([0-9]+)?:([0-9]+)?:(.+)/);

      cl.end();
      io.server.close();

      done();
    });
  },

  // from socket.io manager.test.js
  'test authorization failure in handshake': function (done) {
    var port = ++ports
      , cl = client(port)
      , io = create(cl);

    io.configure(function () {
      function auth (data, fn) {
        fn(null, false);
      };

      io.set('authorization', auth);
    });

    cl.get('/socket.io/{protocol}/', function (res, data) {
      res.statusCode.should.eql(403);
      data.should.match(/handshake unauthorized/);

      cl.end();
      io.server.close();
      done();
    });
  },

  // from socket.io manager.test.js
  'test a handshake error': function (done) {
    var port = ++ports
      , cl = client(port)
      , io = create(cl);

    io.configure(function () {
      function auth (data, fn) {
        fn(new Error);
      };

      io.set('authorization', auth);
    });

    cl.get('/socket.io/{protocol}/', function (res, data) {
      res.statusCode.should.eql(500);
      data.should.match(/handshake error/);

      cl.end();
      io.server.close();
      done();
    });
  },

  // from socket.io manager.test.js
  'test setting a custom heartbeat timeout': function (done) {
    var port = ++ports
      , cl = client(port)
      , io = create(cl);

    io.configure(function () {
      io.set('heartbeat timeout', 33);
    });

    cl.get('/socket.io/{protocol}/', function (res, data) {
      res.statusCode.should.eql(200);
      data.should.match(/([^:]+):33:([0-9]+)?:(.*)/);

      cl.end();
      io.server.close();
      done();
    });
  }

};
