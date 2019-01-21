const DB_SERVICE = 'db-service'

module.exports = app => {
  class Component extends app.Service {
    async insertComponent (payload) {
      const count = await app.model.Component.count()
      payload.id = count + 1

      const component = new app.model.Component(payload)
      const result = await component.save().catch(err => {
        app.logger.error(DB_SERVICE, err)
        throw err
      })
      return result
    }

    async getComponents (condition = {}) {
      const query = await app.model.Component
        .find(condition)
        .catch(err => {
          app.logger.error(DB_SERVICE, err)
          throw err
        })
      return query
    }
  }

  return Component
}
