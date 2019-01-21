const Service = require('egg').Service
const DB_SERVICE = 'db-service'

class TemplateService extends Service {
  async createTemplate (payload) {
    const count = await this.app.model.Template.count()
    payload.id = count + 1

    const template = new this.app.model.Template(payload)
    const result = await template.save().catch(err => {
      this.logger.error(DB_SERVICE, err)
      throw err
    })
    return result
  }

  async getTemplate (condition = {}) {
    const query = await this.app.model.Template
      .find(condition)
      .catch(err => {
        this.logger.error(DB_SERVICE, err)
        throw err
      })
    return query
  }

  async getTemplateById (id) {
    const query = await this.app.model.Template
    return query.findOne({ id })
  }
}

module.exports = TemplateService
