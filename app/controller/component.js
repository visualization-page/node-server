const Controller = require('egg').Controller
const url = require('url')

class ComponentController extends Controller {
  async insert () {
    // const { ctx, service } = this
    // const result = await service.component.insertComponent(ctx.request.body)
    // ctx.body = result
  }

  async query () {
    const { query } = url.parse(this.ctx.request.url, true)
    const { projectPath } = this.config
    const materialsPath = `${projectPath}/${query.dirName}/src/components/config.json`
    // let componentPath = `${projectPath}/${query.projectName}/src`

    // await this.ctx.helper.getDir(materialsPath).catch(async () => {
    //   // 不存在，下载
    //   console.log('不存在，下载')
    //   await this.ctx.helper.downloadRepo(this.config.materialsRepo, materialsPath)
    //   // cp and rm
    //   const origin = `${materialsPath}/src/components`
    //   await this.ctx.helper.exec(`cp -rf ${origin} ${componentPath}`)
    //   await this.ctx.helper.exec(`rm -rf ${materialsPath}`)
    // })
    const info = await this.ctx.helper.readFile(materialsPath)

    // componentPath = `${componentPath}/components`
    // const dir = await this.ctx.helper.getDir(`${componentPath}`)
    // 读取组件package.json
    // const data = await Promise.all(dir.map(item => new Promise(async resolve => {
    //   const isDir = await this.ctx.helper.getDir(`${materialsPath}/${item}`).catch(() => false)
    //   resolve(isDir ? require(`${materialsPath}/${item}/package.json`) : null)
    // })))
    this.ctx.body = {
      success: true,
      data: info ? JSON.parse(info).data : []
    }
  }
}

module.exports = ComponentController
