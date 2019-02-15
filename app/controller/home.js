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
    // 从redis中取出站点状态
    const projectRedisResult = data.length
      ? await this.app.redis.mget(...data.map(item => item.dir_name))
      : []
    this.ctx.body = {
      success: true,
      data: data.map((x, i) => ({
        ...x._doc,
        editStatus: projectRedisResult[i]
      }))
    }
  }

  async delRecord () {
    // 删除数据库记录
    const { id, dirName } = this.ctx.request.body
    await this.service.record.delRecord(id)
    // 删除文件夹
    await this.ctx.helper.exec([`cd ${this.config.projectPath}`, `rm -rf ${dirName}`])
    // 删除redis
    await this.app.redis.del(dirName)
    await this.app.redis.del(`${dirName}_update`)
    this.ctx.body = {
      success: true,
      data: null
    }
  }
}

module.exports = HomeController
