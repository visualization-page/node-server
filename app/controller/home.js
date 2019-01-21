// const Controller = require('egg').Controller
const path = require('path')
const Base = require('./base')
const url = require('url')

class HomeController extends Base {
  async index() {
    // this.ctx.getLogger('operatorLogger').error('1')
    // this.ctx.cookies.set('userId', 1)
    const { query } = url.parse(this.ctx.request.url, true)
    // this.ctx.helper.log.call(this, `hello userId ${query.userId}`)
    this.ctx.body = {
      success: true,
      data: `hello userId ${query.userId}`
    }
  }

  // curl -d "templateId=1" http://localhost:7001/prepareTemplate
  async prepareTemplate () {
    const { templateId, userId, projectName } = this.ctx.request.body
    // 获取template url
    const template = await this.service.template.getTemplateById(templateId)
    const result = await makeTemplateDir.call(
      this,
      template,
      userId,
      projectName
    )
    // TODO 用户表插入一条生成的模版数据
    // this.ctx.body = {
    //   page: result,
    //   template
    // }
    this.ctx.body = { success: true }
  }

  async prepareComponents () {
    // 下载vue物料
    const { ctx, config } = this
    const { downloadRepo } = ctx.helper
    const projectPath = '/Users/yangming/Documents/page-workspace/15475549266380045'
    await downloadRepo(config.materialsRepo, `${projectPath}/${config.materialsRepo}`).catch(this.commonCatch)
    const components = await getComponentsByDir.call(this, `${projectPath}/${config.materialsRepo}`)
    this.ctx.body = components
  }

  async putComponent () {
    const { ctx, config } = this
    const projectPath = '/Users/yangming/Documents/page-workspace/15475549266380045'
    // 改写home文件
    const content = await ctx.helper.readFile(`${projectPath}/src/views/Home.vue`)
    console.log(content)
    await ctx.helper.writeFile(`${projectPath}/src/views/Home.vue`, content.replace('<script>', `
      <script>
      import button from '../../${config.materialsRepo}/src/components/button'
      console.log(button)
    `))
    this.ctx.body = 1
  }
}

async function getComponentsByDir (dir) {
  const dirs = await this.ctx.helper.getDir(`${dir}/src/components`)
  return dirs
}

module.exports = HomeController
