'use strict'

const Controller = require('egg').Controller

class TemplateController extends Controller {
  async query () {
    const result = await this.service.db.getTemplate()
    this.ctx.body = result
  }

  async create () {
    // curl -d 'id=1&name=vue&files=/path' http://localhost:7001/templates
    const { ctx, service } = this
    const result = await service.db.createTemplate(ctx.request.body)
    ctx.body = result
  }
}

module.exports = TemplateController
