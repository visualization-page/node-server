const Controller = require('egg').Controller
const path = require('path')
// const { exec } = require('child_process')
// const subProcessMap = {}

class Util extends Controller {
  emit (message) {
    this.ctx.socket.emit(this.ctx.app.config.logName, message)
  }

  async makeTemplateDir (template, dirName) {
    const repoName = template.files
    const { ctx } = this
    let { projectPath } = ctx.app.config
    const { downloadRepo } = ctx.helper
    this.emit(`创建项目 ${dirName}`)
    projectPath = path.resolve(projectPath, dirName)

    this.emit(`下载模版 ${projectPath}`)
    // await downloadRepo(repoName, projectPath).catch(this.commonCatch)
    this.emit(`模版下载完成`)
    // 安装依赖
    // 启动服务
    this.emit(`安装依赖`)
    const result = await ctx.helper.exec([
      `cd ${projectPath}`,
      // 'cnpm i',
      'npm run serve'
    ], message => this.emit(message), 'http://localhost:(\\d+)').catch(this.commonCatch)

    const pid = await this.getServerPid(dirName)
    // 杀掉启动进程，保留server进程
    await ctx.helper.exec(`kill -9 ${result.child.pid}`)
    this.emit(`server启动地址为：http://localhost:${result.matches[1]}. pid: ${pid}`)
    return {
      serverPid: pid,
      dirName
    }
  }

  async getServerPid (dirName) {
    const res = await this.ctx.helper.exec(`ps gx | grep ${dirName}/node`, undefined, '(\\d+).*?')
    return res.matches[0]
  }
}

class ChatController extends Util {
  async index () {
    const params = this.ctx.args[0]
    if (params instanceof Array) {
      this[params[0]](...params.slice(1, params.length))
    } else {
      console.log(params)
    }
  }

  async prepareTemplate (params) {
    const { templateId, projectName } = params
    const template = await this.service.template.getTemplateById(templateId)
    const result = await this.makeTemplateDir(template, projectName)
    this.emit({ result, name: 'prepareTemplate' })
  }

  async killServer (pid) {
    await this.ctx.helper.exec(`kill -9 ${pid}`)
    this.emit({ result: true, name: 'killServer' })
  }
}

module.exports = ChatController
