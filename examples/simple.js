var simple = require('fs').readFileSync(__dirname + '/simple.html')
 ,  server = require('http').createServer(function(req, res) {
      res.writeHead(200, {"Content-Type": "text/html"});
      res.end(simple);
    })
  , io = require('socket.io').listen(server)
  , RedisStore = require('..');

server.listen(8124);

//io.set('store', new RedisStore({ namespace: 'test:socket.io' }));;
io.set('store', new RedisStore());

io.sockets.on('connection', function (socket) {
  console.log('new connection', socket.id);
  socket.send('>> simple socket.io server');
  socket.on('message', function (data) {
    console.log('message:', data);
    // echo it back to the client
    socket.send(data);
  });
  socket.on('disconnect', function () {
    console.log('disconnect', arguments);
  });
});