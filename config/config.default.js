const path = require('path')

module.exports = appInfo => {
  const config = exports = {}

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1547430745217_7220'

  // add your config here
  config.middleware = []

  config.security = {
    csrf: {
      enable: false
    },
    // 编辑中的的页面在 iframe 中浏览, 所以需要允许
    xframe: {
      enable: false
    }
  }

  // const time = new Date()
  // const date = time.getFullYear() + '-' + (time.getMonth() + 1) + '-' + time.getDate()
  config.logger = {
    // appLogName: `${appInfo.name}-${date}-web.log`
    // appLogName: `${date}.log`
  }

  config.customLogger = {
    operatorLogger: {
      file: path.join(appInfo.root, 'logs/operator.log')
    }
  }

  config.projectPath = `${process.env.HOME}/Documents/page-workspace`
  config.materialsRepo = 'vue-materials'
  config.log = 'operatorLogger'
  config.logName = 'operatorLog'
  config.serverPath = 'http://localhost:3001'

  return config
}
