'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, io } = app

  app.resources('/templates_resources', controller.template)
  router.get('/templates', controller.template.query)
  router.post('/templates', controller.template.create)
  router.get('/components', controller.component.query)
  router.get('/records', controller.home.getRecords)
  router.get('/', controller.home.index)
  io.of('/').route('chat', io.controller.chat.index)
}
