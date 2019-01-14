'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app

  app.resources('/templates_resources', controller.template)

  router.get('/templates', controller.template.query)
  router.post('/templates', controller.template.create)

  router.post('/prepareTemplate', controller.home.prepareTemplate)

  router.get('/', controller.home.index)
}
