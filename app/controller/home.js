const Base = require('./base')
const url = require('url')

class HomeController extends Base {
  async index() {
    const { query } = url.parse(this.ctx.request.url, true)
    this.ctx.body = {
      success: true,
      data: `hello userId ${query.userId}`
    }
  }

  async getRecords () {
    const data = await this.service.record.getRecords()
    this.ctx.body = {
      success: true,
      data
    }
  }
}

module.exports = HomeController
