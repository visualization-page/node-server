const Controller = require('egg').Controller

class ComponentController extends Controller {
  async insert () {
    const { ctx, service } = this
    const result = await service.component.insertComponent(ctx.request.body)
    ctx.body = result
  }

  async query () {
    const result = await this.service.component.getComponents()
    this.ctx.body = result
  }
}

module.exports = ComponentController
