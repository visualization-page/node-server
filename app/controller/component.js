const Controller = require('egg').Controller
const url = require('url')

class ComponentController extends Controller {
  async insert () {
    const { ctx, service } = this
    const result = await service.component.insertComponent(ctx.request.body)
    ctx.body = result
  }

  async query () {
    const { query } = url.parse(this.ctx.request.url, true)
    const { projectPath } = this.config
    const materialsPath = `${projectPath}/${query.projectName}/${this.config.materialsRepo}`

    await this.ctx.helper.getDir(materialsPath).catch(async () => {
      // 不存在，下载
      console.log('不存在，下载')
      await this.ctx.helper.downloadRepo(this.config.materialsRepo, materialsPath)
      await this.ctx.helper.getDir(materialsPath)
    })

    const materials = `${materialsPath}/src/components`
    const dir = await this.ctx.helper.getDir(materials)
    // 读取组件package.json
    this.ctx.body = {
      success: true,
      data: dir.map(item => require(`${materials}/${item}/package.json`))
    }
  }
}

module.exports = ComponentController
