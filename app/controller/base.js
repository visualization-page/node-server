const Controller = require('egg').Controller
const HOME_CONTROLLER = 'home-controller'

class BaseController extends Controller {
  // constructor () {
  //   super()
  //   this.projectPath = ''
  // }
  commonCatch (err) {
    this.logger.error(HOME_CONTROLLER, err)
    throw err
  }
}

module.exports = BaseController
