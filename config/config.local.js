exports.graphql = {
  router: '/graphql'
}

exports.mongoose = {
  client: {
    url: 'mongodb://127.0.0.1:27017/test',
    options: {},
  },
}

exports.middleware = ['graphql']

// exports.websocket = {
//   port: 8080,
//   path: '/test'
// }

exports.io = {
  init: { }, // passed to engine.io
  namespace: {
    // '/operateLog': {
    //   connectionMiddleware: [],
    //   packetMiddleware: []
    // }
  }
}

exports.serverPath = 'http://localhost:3001'
exports.projectPath = `${process.env.HOME}/Documents/page-workspace`

