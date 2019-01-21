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
    const { downloadRepo, getDir } = ctx.helper
    projectPath = path.resolve(projectPath, dirName)
    this.emit(`创建项目 ${projectPath}`)

    await getDir(projectPath).catch(async () => {
      this.emit(`下载模版 ${projectPath}`)
      await downloadRepo(repoName, projectPath)
      this.emit(`模版下载完成，开始安装依赖`)
      await ctx.helper.exec([`cd ${projectPath}`, 'cnpm i'], message => this.emit(message))
    })
    this.emit(`启动服务`)
    const result = await ctx.helper.exec(
      [`cd ${projectPath}`, 'npm run serve'],
      this.emit.bind(this),
      'http://localhost:(\\d+)'
    )
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
    const { templateId, projectName, pid } = params
    if (pid) {
      // kill pid
      this.emit(`server 已存在，结束进程后进行后续操作`)
      await this.killServer(pid)
    }

    const template = await this.service.template.getTemplateById(templateId)
    const result = await this.makeTemplateDir(template, projectName).catch(err => {
      console.log(err)
    })
    this.emit({ result, name: 'prepareTemplate' })
  }

  async killServer (pid) {
    await this.ctx.helper.exec(`kill -9 ${pid}`)
    this.emit({ result: true, name: 'killServer' })
  }

  async lookProcess (projectName) {
    await this.ctx.helper.exec(`ps gx | grep page-workspace/${projectName || ''}`, this.emit.bind(this))
  }
}

module.exports = ChatController
