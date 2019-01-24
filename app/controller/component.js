const Controller = require('egg').Controller
const url = require('url')

class ComponentController extends Controller {
  async insert () {
    // const { ctx, service } = this
    // const result = await service.component.insertComponent(ctx.request.body)
    // ctx.body = result
  }

  async query () {
    const { query } = url.parse(this.ctx.request.url, true)
    const { projectPath } = this.config
    const materialsPath = `${projectPath}/${query.dirName}/src/components/config.json`
    const info = await this.ctx.helper.readFile(materialsPath)
    this.ctx.body = {
      success: true,
      data: info ? JSON.parse(info).data : []
    }
  }
}

module.exports = ComponentController
