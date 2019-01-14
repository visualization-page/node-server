const Controller = require('egg').Controller
const path = require('path')

class HomeController extends Controller {
  async index() {
    console.log(this.ctx.socket)
    this.ctx.body = 'hi, egg'
  }

  // curl -d "templateId=1" http://localhost:7001/prepareTemplate
  async prepareTemplate () {
    const { templateId } = this.ctx.request.body
    // 获取template url
    const template = await this.service.db.getTemplateById(templateId)

    // console.log(template)
    const result = await makeTemplateDir.call(this, templateId, '1', template.files)
    this.ctx.body = {
      page: result,
      template
    }
  }
}

async function makeTemplateDir (templateId, projectId, repoName) {
  const { ctx, config } = this
  const { downloadRepo, getDir } = ctx.helper
  // 下载template
  // 解压template
  const projectPath = path.resolve(config.projectPath, projectId, repoName)
  await downloadRepo(repoName, projectPath).catch(err => {
    this.logger.error('controller-makeTemplateDir', err)
    throw err
  })
  // 安装依赖
  // 启动服务
  const dirs = await getDir(projectPath)
  // console.log(isExist)
  if (!dirs) {
    await ctx.helper.exec([
      `cd ${projectPath}`,
      'cnpm i',
    ], 'All packages installed').catch(err => {
      this.logger.error('controller-makeTemplateDir', err)
      throw err
    })
  }
  await ctx.helper.exec([
    `cd ${projectPath}`,
    'npm run serve'
  ], 'Compiled successfully').catch(err => {
    this.logger.error('controller-makeTemplateDir', err)
    throw err
  })

  return {
    projectPath,
    projectId
  }
}

module.exports = HomeController
