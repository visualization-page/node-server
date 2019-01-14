module.exports = app => {
  class Db extends app.Service {
    async createTemplate (payload) {
      const count = await app.model.Template.count()
      payload.id = count + 1

      const template = new app.model.Template(payload)
      const result = await template.save().catch(err => {
        app.logger.error('db-service', err)
        throw err
      })
      return result
    }

    async getTemplate (condition = {}) {
      const query = await app.model.Template
        .find(condition)
        .catch(err => {
          app.logger.error('db-service', err)
          throw err
        })
      return query
    }

    async getTemplateById (id) {
      const query = await app.model.Template
      return query.findOne({ id })
    }
  }

  return Db
}
