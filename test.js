const server = require('http').createServer();
const io = require('socket.io')(server);
io.on('connection', client => {
  // client.on('event', data => {
  //   console.log(data)
  //
  //   setInterval(() => {
  //     io.emit('res1', '我收到了')
  //   }, 2000)
  // });
  io.emit('res1', '我收到了')
  client.on('disconnect', () => { /* … */ });
});
server.listen(3000);
