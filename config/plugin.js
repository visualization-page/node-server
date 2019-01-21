'use strict';

// had enabled by egg
// exports.static = true;
exports.graphql = {
  enable: true,
  package: 'egg-graphql'
}

exports.mongoose = {
  enable: true,
  package: 'egg-mongoose'
}

// exports.websocket = {
//   enable: true,
//   package: 'egg-websocket'
// }

exports.io = {
  enable: true,
  package: 'egg-socket.io'
}
