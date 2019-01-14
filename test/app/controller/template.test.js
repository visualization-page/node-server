'use strict'

const { app, mock, assert } = require('egg-mock/bootstrap')

describe('test/app/controller/template.test.js', () => {
  it('should create success /templates', () => {
    // https://github.com/visionmedia/supertest
    return app.httpRequest()
      .post('/templates')
      .send('id=1')
      .send('name=vue')
      .send('files=/path')
      // .expect('hi, egg')
      .expect(200)
  })
})
