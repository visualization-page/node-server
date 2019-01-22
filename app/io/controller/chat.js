const Controller = require('egg').Controller
const path = require('path')

class Util extends Controller {
  emit (message) {
    this.ctx.socket.emit(this.ctx.app.config.logName, message)
  }

  async makeTemplateDir (repoName, dirName) {
    // const repoName = template.files
    const { ctx } = this
    let { projectPath } = ctx.app.config
    const { downloadRepo, readFile } = ctx.helper

    projectPath = path.resolve(projectPath, dirName)
    this.emit(`创建项目 ${projectPath}`)

    await readFile(`${projectPath}/package.json`).catch(async () => {
      this.emit(`下载模版 ${projectPath}`)
      await downloadRepo(repoName, projectPath)
      this.emit(`模版下载完成，开始安装依赖`)
      await ctx.helper.exec([`cd ${projectPath}`, 'cnpm i'], this.emit.bind(this))
    })
    this.emit(`启动服务`)
    const result = await ctx.helper.exec(
      [`cd ${projectPath}`, 'npm run serve'],
      this.emit.bind(this),
      'http://localhost:(\\d+)'
    )
    const pid = await this.getServerPid(dirName)
    // 杀掉启动进程，保留server进程
    await ctx.helper.exec(`kill -9 ${result.child.pid}`)
    const port = result.matches[1]
    const url = `http://localhost:${port}`
    this.emit(`server启动地址为：${url}. pid: ${pid}. port: ${port}`)
    return {
      pid,
      url,
      dirName,
      port
    }
  }

  async checkMaterials () {
    // 物料是全局的
    this.emit('检查物料')
    const { projectPath, materialsRepo } = this.ctx.app.config
    const { downloadRepo, getDir } = this.ctx.helper
    const materialsPath = `${projectPath}/${materialsRepo}`
    await getDir(materialsPath).catch(async () => {
      this.emit(`准备下载物料 ${materialsPath}`)
      await downloadRepo(materialsRepo, materialsPath)
      // return await getDir(materialsPath)
    })
    this.emit('物料准备完成')
    return true
  }

  async getServerPid (dirName) {
    const res = await this.ctx.helper.exec(`ps gx | grep ${dirName}/node`, undefined, '(\\d+).*?')
    return res.matches[0]
  }

  // { pid, url, dirName, port }
  async saveProjectInfo (data) {
    const { projectPath } = this.ctx.app.config
    const { readFile, writeFile } = this.ctx.helper
    const jsonPath = `${projectPath}/${data.dirName}/site.json`
    const existData = await readFile(jsonPath).catch(async () => {
      await writeFile(jsonPath, JSON.stringify(data, null, 2))
      return null
    })
    if (existData) {
      // merge
      await writeFile(jsonPath, JSON.stringify({ ...JSON.parse(existData), ...data }, null, 2))
    }
    return true
  }

  async getProjectInfo (dirName) {
    const { projectPath } = this.ctx.app.config
    const jsonPath = `${projectPath}/${dirName}/site.json`
    return await this.ctx.helper.readFile(jsonPath).then(res => JSON.parse(res)).catch(() => null)
  }

  async injectComponent (dirName, templateComponents) {
    const { readFile, writeFile } = this.ctx.helper
    const targetPath = `${this.config.projectPath}/${dirName}/src/views/Home.vue`
    const content = await readFile(targetPath).catch(err => {
      this.emit(JSON.stringify(err))
      throw err
    })

    const result = content.replace(/\/\/ inject-start\n[\s\S]+\/\/ inject-end/, () => {
      // match, p1, offset, string
      const componentImport = templateComponents.map(x => `import ${x.name}${x.id} from '${x.path}'`)
      componentImport.unshift(`// inject-start`)
      componentImport.push(`const components = ${JSON.stringify(templateComponents, null, 2)}`)
      componentImport.push('const importList = {')
      templateComponents.forEach(x => componentImport.push(`  '${x.name}-${x.id}': ${x.name}${x.id},`))
      componentImport.push('}')
      componentImport.push(`// inject-end`)
      // const content = `// inject-start\n${componentImport.join('\n')}\nconst components = ${JSON.stringify(mockData, null, 2)}\n// inject-end`
      return componentImport.join('\n')
    })
    await writeFile(targetPath, result)
  }
}

class ChatController extends Util {
  async index () {
    const params = this.ctx.args[0]
    if (params instanceof Array) {
      this[params[0]](...params.slice(1, params.length))
    } else {
      console.log(params)
    }
  }

  async prepareTemplate (params) {
    const { service } = this
    const { templateId, projectName, recordId } = params
    const info = await this.getProjectInfo(projectName)

    if (info && info.pid) {
      // kill pid
      this.emit(`server 已存在，结束进程后进行后续操作`)
      await this.killServer(info)
    }

    // 检查物料
    await this.checkMaterials(projectName)
    // 获取模版信息
    let template = info && info.template
    if (!template) {
      template = await service.template.getTemplateById(templateId)
    }
    // 生成模版
    const result = await this.makeTemplateDir(template.files, projectName).catch(err => {
      console.log(err)
    })
    // 将基本信息保存在项目本地
    await this.saveProjectInfo({ ...result, template })

    // 写入数据库
    if (!recordId) {
      const record = await service.record.create({
        name: '站点名称',
        dir_name: projectName,
        template_id: templateId
      })
      result.recordId = record.id
    }
    this.emit({ result, name: 'prepareTemplate' })
  }

  async killServer ({ pid, dirName }) {
    if (pid) {
      await this.ctx.helper.exec(`kill -9 ${pid}`)
      // update info
      await this.saveProjectInfo({ pid: '', dirName })
      this.emit({ result: true, name: 'killServer' })
    } else {
      this.emit('pid为空')
    }
  }

  async lookProcess (projectName) {
    await this.ctx.helper.exec(`ps gx | grep page-workspace/${projectName || ''}`, this.emit.bind(this))
  }

  async putComponent (params) {
    const info = await this.getProjectInfo(params.dirName)
    const { materialsRepo, projectPath } = this.config
    // 当前模版所用到的组件
    const itemPath = `${materialsRepo}/src${params.item.path.replace('@', '')}`
    const itemDir = `${itemPath.substring(0, itemPath.lastIndexOf('/'))}`
    const item = {
      ...params.item,
      id: Date.now(),
      path: `../../../${itemPath}`,
      props: require(`${projectPath}/${itemDir}/package.json`).props,
      schema: require(`${projectPath}/${itemDir}/schema.js`)
    }
    let templateComponents = info.components
    if (!templateComponents) {
      templateComponents = [item]
    } else {
      templateComponents.push(item)
    }
    this.emit('组合成全量组件，注入文件中')
    await this.injectComponent(params.dirName, templateComponents)
    this.emit('保存组件信息')
    await this.saveProjectInfo({ components: templateComponents, dirName: params.dirName })
    this.emit({ result: true, name: 'putComponent' })
  }

  async projectInfo (dirName) {
    const info = await this.getProjectInfo(dirName)
    if (info.pid) {
      // 验证pid的有效性
      await this.ctx.helper.exec(`curl ${info.url}`).catch(async () => {
        await this.saveProjectInfo({ dirName, url: '', pid: '' })
        info.url = ''
        info.pid = ''
      })
    }
    this.emit({ result: info, name: 'projectInfo' })
  }

  async updateComponents ({ dirName, props, componentId }) {
    const info = await this.getProjectInfo(dirName)
    info.components.forEach(item => {
      if (item.id === componentId) {
        item.props = props
      }
    })
    this.emit('更新全量写入组件')
    await this.injectComponent(dirName, info.components)
    this.emit('保存组件信息')
    await this.saveProjectInfo({ components: info.components, dirName })
    this.emit({ result: true, name: 'updateComponents' })
  }

  async delComponents ({ dirName, componentId }) {
    const info = await this.getProjectInfo(dirName)
    const index = info.components.find(x => x.id === componentId)
    info.components.splice(index, 1)
    await this.injectComponent(dirName, info.components)
    await this.saveProjectInfo({ components: info.components, dirName })
    this.emit('删除组件成功')
    this.emit({ result: componentId, name: 'delComponents' })
  }
}

module.exports = ChatController
