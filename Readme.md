Redis Implementation of Socket.IO Store
=======================================

  ![](http://f.cl.ly/items/1F3V1Z3u422O3p1P0X0k/really.gif)

&lt;blink&gt; _This Storage/Dispatch engine for Socket.IO is under active development. It is not ready for production._ &lt;/blink&gt;

In order to make this viable, I am working on patching Socket.IO. That code can be found in my fork: [/dshaw/Socket.IO-node](https://github.com/dshaw/Socket.IO-node/tree/extern/). Forks and contributions are welcome.


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
