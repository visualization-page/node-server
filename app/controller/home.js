const Controller = require('egg').Controller
const path = require('path')

class HomeController extends Controller {
  async index() {
    console.log(this.ctx.socket)
    this.ctx.body = 'hi, egg'
  }

  async prepareTemplate () {
    const res = await makeTemplateDir.call(this, this.ctx.request.body.templateId, 1)
    this.ctx.body = res
  }
}

async function makeTemplateDir (templateId, pageId) {
  const { ctx, service, config } = this
  const { downloadRepo } = ctx.helper
  // 获取template url
  const res = await service.db.getTemplateById(templateId)
  // 下载template
  // 解压template
  const template = 'node-server'
  // curl -d "templateId=1" http://localhost:7001/prepareTemplate
  const projectPath = path.resolve(process.cwd(), config.projectPath, template)
  await downloadRepo(template, projectPath)
  // await downloadRepo('vue-slip-delete', projectPath, 'Jmingzi')
  // 安装依赖
  // 启动服务
  await ctx.helper.exec([
    `cd ${projectPath}`,
    'npm i'
  ])
}

module.exports = HomeController
