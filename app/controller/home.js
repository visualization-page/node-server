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

  async delRecord () {
    // 删除数据库记录
    const { id, dirName } = this.ctx.request.body
    await this.service.record.delRecord(id)
    // 删除文件夹
    // const projectPath = `${this.config.projectPath}`
    await this.ctx.helper.exec([`cd ${this.config.projectPath}`, `rm -rf ${dirName}`])
    this.ctx.body = {
      success: true,
      data: null
    }
  }
}

module.exports = HomeController
