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

exports.websocket = {
}
