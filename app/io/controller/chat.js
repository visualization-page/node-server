const Controller = require('egg').Controller
const path = require('path')
const semver = require('semver')

class Util extends Controller {
  emit (message) {
    this.ctx.socket.emit(this.ctx.app.config.logName, message)
  }

  getProjectPath (dirName) {
    return path.resolve(this.config.projectPath, dirName)
  }

  async execInDir (dirName, cmd) {
    if (typeof cmd === 'string') {
      cmd = [cmd]
    }
    const projectPath = this.getProjectPath(dirName)
    cmd.unshift(`cd ${projectPath}`)
    return this.ctx.helper.exec(cmd, this.emit.bind(this))
  }

  /**
   * 处理模版
   * @param repoName {String} 模版repository名称
   * @param dirName {String} 项目文件夹名称
   * @returns {Promise<{url: string, dirName: *}>}
   */
  async makeTemplateDir (repoName, dirName) {
    const { serverPath } = this.config
    const { downloadRepo, readFile } = this.ctx.helper
    const projectPath = path.resolve(this.config.projectPath, dirName)

    this.emit(`创建项目 ${projectPath}`)
    const exist = await readFile(`${projectPath}/package.json`).catch(async () => {
      this.emit(`下载模版 ${projectPath}`)
      await downloadRepo(repoName, projectPath)
      this.emit(`模版下载完成，安装依赖`)
      await this.execInDir(dirName, `cnpm install`)
      // await this.ctx.helper.exec([
      //   `cd ${projectPath}`,
      //   `cnpm install`
      // ], this.emit.bind(this))
      this.emit(`安装依赖完成`)
      return null
    })
    exist && this.emit(`项目已存在 ${projectPath}`)
    return {
      url: `${serverPath}/${dirName}/dist/index.html`,
      dirName
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

  /**
   * 保存项目的基本信息到文件
   * @param data
   * @returns {Promise<boolean>}
   */
  async saveProjectInfo (data) {
    const { projectPath } = this.config
    const { readFile, writeFile } = this.ctx.helper
    const jsonPath = `${projectPath}/${data.dirName}/site-config.json`
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
    const jsonPath = `${projectPath}/${dirName}/site-config.json`
    return await this.ctx.helper.readFile(jsonPath).then(res => JSON.parse(res)).catch(() => null)
  }
}

class ChatController extends Util {
  /**
   * socket 协议转发
   * params {Array} array[0]为方法名称，剩余参数为方法参数
   */
  async index () {
    const params = this.ctx.args[0]
    if (params instanceof Array) {
      try {
        this[params[0]](...params.slice(1, params.length))
      } catch (e) {
        this.emit(e.message)
      }
    } else {
      this.emit(`参数不合法，必须为数组`)
    }
  }

  async init () {
    this.emit('socket已连接')
    // 初始化projectPath
    const { initWorkspace } = this.config.redisKey
    const isDocDirExist = await this.app.redis.get(initWorkspace)
    if (!isDocDirExist) {
      const { exec, getDir } = this.ctx.helper
      await exec(`mkdir -p ${this.config.projectPath}`)
      const reCheck = await getDir(this.config.projectPath).catch(() => null)
      if (reCheck) {
        await this.app.redis.set(initWorkspace, true)
        this.emit('初始化工作目录完成')
      }
    }
  }

  async savePageConfig ({ title, bgColor, dirName, pageId }) {
    const info = await this.getProjectInfo(dirName)
    if (pageId) {
      info.multiData[pageId].title = title
      info.multiData[pageId].bgColor = bgColor
      await this.saveProjectInfo(info)
    } else {
      await this.saveProjectInfo({ ...info, title, bgColor })
    }
    await this.renderComponent(dirName)
    this.emit({ result: { title, bgColor }, name: 'savePageConfig' })
  }

  /**
   * 下载与准备模版
   * @param templateId {Number} 模版id
   * @param projectName {String} 项目文件夹
   * @param recordId {Number} 编辑时的记录id
   * @param siteName {String} 站点名称
   * @returns {Promise<void>}
   */
  async prepareTemplate ({ templateId, dirName, recordId }) {
    this.emit('检查文件夹是否存在')
    const exist = await this.ctx.helper.readFile(`${this.config.projectPath}/${dirName}/package.json`)
      .then(() => true)
      .catch(() => false)
    if (exist) {
      this.emit({ result: { exist: true }, name: 'prepareTemplate' })
      return
    }

    const { service } = this
    const info = await this.getProjectInfo(dirName)
    // 检查物料
    // await this.checkMaterials(dirName)
    this.emit('获取模版信息')
    let template = info && info.template
    if (!template) {
      template = await service.template.getTemplateById(templateId)
    }
    this.emit('生成模版')
    const result = await this.makeTemplateDir(template.files, dirName).catch(err => {
      this.emit(err.message || JSON.stringify(err))
    })
    this.emit('将项目信息写入项目文件/site-config.json')
    await this.saveProjectInfo({ ...result, template })

    this.emit('新建模版，写入数据库')
    if (!recordId) {
      const record = await service.record.create({
        dir_name: dirName,
        template_id: templateId,
        url: result.url
      })
      result.recordId = record.id
    }
    this.emit('写入更新缓存')
    await this.app.redis.set(`${dirName}_update`, Date.now())
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

  async lookProcess () {
    await this.ctx.helper.exec(`ps gx | grep node`, this.emit.bind(this))
  }

  /**
   * 未发布前的提交预览
   * @param dirName
   * @returns {Promise<*>}
   */
  async renderComponent (dirName) {
    // 重新render
    // const { exec } = this.ctx.helper
    // const projectPath = path.resolve(this.config.projectPath, dirName)
    await this.execInDir(dirName, 'npm run render').catch(err => {
      console.log(err)
    })
    // 直接改写html文件内的data
    // const { readFile, writeFile, reg } = this.ctx.helper
    // const targetPath = `${this.config.projectPath}/${dirName}/dist/index.html`
    // const content = await readFile(targetPath).catch(err => {
    //   this.emit(JSON.stringify(err))
    //   throw err
    // })
    // const info = await this.getProjectInfo(dirName)
    // const final = content.replace(reg('global-data'), (a, b) => {
    //   return a.replace(b, `\n  window.INIT_DATA=${JSON.stringify(info.components)}\n  `)
    // })
    // return await writeFile(targetPath, final)
  }

  /**
   * 获取项目基本信息
   * @param dirName
   * @returns {Promise<void>}
   */
  async projectInfo ({ dirName, pageId }) {
    let result = await this.getProjectInfo(dirName)
    if (pageId) {
      result = result.multiData[pageId]
    }
    this.emit({ result, name: 'projectInfo' })
  }

  /**
   * 添加组件
   * @param dirName
   * @param item {String} 组件信息
   * @returns {Promise<void>}
   */
  async putComponent ({ dirName, item, pageId }) {
    const info = await this.getProjectInfo(dirName)
    const pushItem = {
      ...item,
      id: `${Date.now()}-${Math.ceil(Math.random()*100)}`
    }
    this.emit('保存新增组件信息')
    if (pageId) {
      info.multiData[pageId].components.push(pushItem)
      await this.saveProjectInfo({ dirName, multiData: info.multiData })
    } else {
      info.components.push(pushItem)
      await this.saveProjectInfo({ components: info.components, dirName })
    }
    await this.renderComponent(dirName)
    this.emit({ result: pushItem, name: 'putComponent' })
  }

  /**
   * 更新组件信息
   * @param dirName
   * @param props {Object}
   * @param componentId
   * @returns {Promise<void>}
   */
  async updateComponent ({ dirName, props, componentId, pageId }) {
    const info = await this.getProjectInfo(dirName)
    if (pageId) {
      info.multiData[pageId].components.forEach(item => {
        if (item.id === componentId) {
          item.props = props
        }
      })
      await this.saveProjectInfo({ multiData: info.multiData, dirName })
    } else {
      info.components.forEach(item => {
        if (item.id === componentId) {
          item.props = props
        }
      })
      await this.saveProjectInfo({ components: info.components, dirName })
    }
    await this.renderComponent(dirName)
    this.emit({ result: info.components, name: 'updateComponent' })
  }

  /**
   * 删除组件
   * @param dirName
   * @param componentId
   * @returns {Promise<void>}
   */
  async delComponent ({ dirName, componentId, pageId }) {
    const info = await this.getProjectInfo(dirName)
    if (pageId) {
      const index = info.multiData[pageId].components.findIndex(x => x.id === componentId)
      info.multiData[pageId].components.splice(index, 1)
      await this.saveProjectInfo({ multiData: info.multiData, dirName })
    } else {
      const index = info.components.findIndex(x => x.id === componentId)
      info.components.splice(index, 1)
      await this.saveProjectInfo({ components: info.components, dirName })
    }
    await this.renderComponent(dirName)
    this.emit({ result: { componentId, components: info.components }, name: 'delComponent' })
  }

  /**
   * 发布项目
   * @param dirName
   * @returns {Promise<void>}
   */
  async publish (dirName) {
    // 将组件数据注入模版页面内
    const { readFile, writeFile, reg, getDir } = this.ctx.helper
    const projectPath = `${this.config.projectPath}/${dirName}`
    const pagePath = `${projectPath}/src/views/Index.vue`
    const info = await this.getProjectInfo(dirName)
    const content = await readFile(pagePath).catch(err => {
      this.emit(JSON.stringify(err))
      throw err
    })
    // 替换页面数据
    const final = content.replace(reg('inject'), (a, b) => {
      return a.replace(b, `\n  const components = ${JSON.stringify(info.components)}\n  `)
    })
    // 写入数据
    await writeFile(pagePath, final)
    this.emit('将组件注入src/views/Index.vue完成')
    this.emit('检查模块依赖')
    await getDir(`${projectPath}/node_modules`).catch(async () => {
      this.emit('依赖不存在、安装依赖')
      // await exec([`cd ${projectPath}`, 'cnpm install'], this.emit.bind(this))
      await this.execInDir(dirName, 'cnpm install')
    })
    this.emit('打包项目')
    // await exec([`cd ${projectPath}`, `npm run build:release`], this.emit.bind(this)).catch(err => {
    await this.execInDir(dirName, `npm run build:release`).catch(err => {
      if (err) throw err
    })
    this.emit('将组件注入src/views/Index.vue数据回写还原')
    await writeFile(pagePath, content)
    this.emit('构建到release完成')
    this.emit('更该数据库记录为已构建')
    await this.service.record.updateRecord(dirName, { status: 1 })
    this.emit({ name: 'publish', result: { url: `${this.config.serverPath}/${dirName}/release/index.html` }})
  }

  async updateComponentSort ({ data, dirName, pageId }) {
    if (pageId) {
      const info = await this.getProjectInfo(dirName)
      info.multiData[pageId].components = data
      await this.saveProjectInfo({ multiData: info.multiData, dirName })
    } else {
      await this.saveProjectInfo({ components: data, dirName })
    }
    await this.renderComponent(dirName)
    this.emit({ result: true, name: 'updateComponentSort' })
  }

  async setProjectStatus ({ dirName, status }) {
    const res = await this.app.redis.set(dirName, status, 'EX', 1 * 60) // 1min
      .catch(err => this.emit(err.message))
    if (res === 'OK') {
      this.emit(`更新站点${dirName}状态为${status}`)
      this.emit({ result: status, name: 'setProjectStatus' })
    }
  }

  /**
   * 检查远程模版与组件库是否更新
   * 用redis记录更新缓存时间
   * @param dirName
   * @returns {Promise<void>}
   */
  async checkTemplateComponentUpdate ({ dirName }) {
    this.emit('检查模版与组件更新缓存')
    // const redisKey = `${dirName}_update`
    const { version } = this.config.redisKey
    const projectPath = this.getProjectPath(dirName)
    const componentFile = '/src/components/config.json'
    // console.log()

    const doUpdate = async () => {
      this.emit('组件和模版有更新，开始下载模版')
      const oldJson = require(`${projectPath}/site-config.json`)
      const dest = path.join(projectPath, '../../', 'cache-template')
      const { downloadRepo, exec, getDir, writeFile } = this.ctx.helper
      await downloadRepo(oldJson.template.files, dest)
      const notUpdate = ['release', 'site-config.json']

      const files = await getDir(dest)
      const arr = []
      files.forEach(file => {
        if (notUpdate.every(x => x !== file)) {
          arr.push(`cp -rf ${dest}/${file} ${projectPath}`)
        }
      })
      await exec(arr)

      // 更新 site-config.json 中的schema
      this.emit('升级schema')
      const schemaCache = {}
      const updateSchema = arr => {
        arr.forEach(item => {
          // let type = item.path.substr(item.path.lastIndexOf('/')).replace('/', '')
          if (!schemaCache[item.name]) {
            schemaCache[item.name] = require(`${projectPath}/${item.path.replace('@', 'src').replace(`/index.vue`, '/schema.js')}`)
          }
          item.schema = schemaCache[item.name]
        })
        return arr
      }
      oldJson.components = updateSchema(oldJson.components)
      Object.keys(oldJson.multiData).forEach(key => {
        oldJson.multiData[key].components = updateSchema(oldJson.multiData[key].components)
      })
      await writeFile(`${projectPath}/site-config.json`, JSON.stringify(oldJson, null, 2))
      this.emit('升级schema完成')

      this.emit('重新render页面')
      await this.renderComponent(dirName)
      this.emit('重新render完成')
      await this.app.redis.set(version, JSON.stringify({
        component: require(`${dest}${componentFile}`).version,
        template: require(`${dest}/package.json`).version
      }))
    }

    const remoteVersion = await this.app.redis.get(version)
    if (!remoteVersion) {
      this.emit('远端version不存在')
      await doUpdate()
    } else {
      const nowComponentVersion = require(`${projectPath}${componentFile}`).version
      const nowTemplateVersion = require(`${projectPath}/package.json`).version
      // console.log(require(`${projectPath}/package.json`))
      const { component, template } = JSON.parse(remoteVersion)
      if (
        semver.gt(template, nowTemplateVersion) ||
        component > nowComponentVersion
      ) {
        this.emit(`远端version: ${template}, ${component}；本地: ${nowTemplateVersion}, ${nowComponentVersion}`)
        await doUpdate()
      }
    }
    this.emit({ result: '校验完成', name: 'checkTemplateComponentUpdate' })
  }
}

module.exports = ChatController
