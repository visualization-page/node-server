const DB_SERVICE = 'db-service'

module.exports = app => {
  class Component extends app.Service {
    async create (payload) {
      const count = await app.model.Record.count()
      payload.id = count + 1

      const component = new app.model.Record(payload)
      const result = await component.save().catch(err => {
        app.logger.error(DB_SERVICE, err)
        throw err
      })
      return result
    }

    async getRecords (condition = {}) {
      const query = await app.model.Record
        .find(condition)
        .catch(err => {
          app.logger.error(DB_SERVICE, err)
          throw err
        })
      return query
    }

    async delRecord (id) {
      return await app.model.Record.deleteOne({ id })
    }
  }

  return Component
}
