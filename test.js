// const server = require('http').createServer();
// const io = require('socket.io')(server);
// io.on('connection', client => {
//   // client.on('event', data => {
//   //   console.log(data)
//   //
//   //   setInterval(() => {
//   //     io.emit('res1', '我收到了')
//   //   }, 2000)
//   // });
//   io.emit('res1', '我收到了')
//   client.on('disconnect', () => { /* … */ });
// });
// server.listen(3000);

const fs = require('fs')
const path = require('path')
// console.log(path.resolve(__dirname, './a/b'))
// fs.mkdir(path.resolve(__dirname, './a/b'), { recursive: true }, err => {
//   if (err) throw err
// })

fs.readdir('/tmp/a', (err, data) => {
  if (err) throw err;
  console.log(data)
});
