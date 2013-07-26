Redis Implementation of Socket.IO Store
=======================================

# STATUS: Deprecated. No longer under development.

[RedisStore](https://github.com/LearnBoost/socket.io/blob/0.9/lib/socket.io.js#L129-L135) was added to Socket.io core up through v1.0. Please use that instead.

I'm leaving this up for historical reference and because I think there are some fundamentally better approaches in the way this version of a Redis-based Socket.io Store was designed to handle sessions. However, to make this compatible with Socket.io core would take another major internal architectural re-write of core.

## More Socket.io goodness

If you like [Socket.io RedisStore](https://github.com/LearnBoost/socket.io/blob/0.9/lib/stores/redis.js), you might also be interested in my other Socket.io modules:

* [socket.io-announce](https://github.com/dshaw/socket.io-announce) - Lightweight infrastructure broadcasting for use with Socket.io RedisStore.
* [socket.io-zero](https://github.com/dshaw/socket.io-zero) - ZeroMQ dispatch with Redis distributed persistance Socket.io Store. 


--------------------------------

#socket.io-redis

Setup
----------------

```bash
cd Socket.IO-redis
npm install
```

Run the Examples
----------------

```bash
redis-server
redis-cli
> monitor
node examples/simple.js
```

open [http://localhost:8124](http://localhost:8124)

Run the Tests
----------------

```bash
npm test
```
