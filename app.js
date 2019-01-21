class AppBootHook {
  constructor(app) {
    this.app = app
  }

  configWillLoad() {
    // 根据当前使用者唯一标识改写filename
    // console.log(this.app.config.customLogger.operatorLogger)
    // this.app.config.customLogger.operatorLogger.file += `.user-${userId}`
  }

  async didLoad() {
    // this.app.getLogger('operatorLogger')
    //   .set('remote', new RemoteErrorTransport({ level: 'DEBUG', app: this.app }))
  }
}

module.exports = AppBootHook
