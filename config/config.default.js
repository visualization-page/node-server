'use strict'

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



  config.projectPath = 'app/public/project'

  return config
}
