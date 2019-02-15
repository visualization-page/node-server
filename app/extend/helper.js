const download = require('download-git-repo')
const { spawn } = require('child_process')
const fsPromise = require('fs').promises
// const net = require('net')

module.exports = {
  downloadRepo (repoName, dest, owner = 'visualization-page') {
    return new Promise((resolve, reject) => {
      download(`github:${owner}/${repoName}`, dest, err => {
        if (err) reject(err)
        else resolve()
      })
    })
  },

  // 检查目录是否存在
  // 不存在则新建
  async checkMakeDir (path) {
    console.log(path)
    await this.getDir(path).then(res => {
      console.log(res)
    }).catch(async () => {
      console.log(111)
      const dir = path.substr(path.lastIndexOf('/'))
      console.log(dir, '=====')
      await this.exec([
        `cd ${path.replace(dir, '')}`,
        `mkdir -p ${dir}`
      ]).catch(err => {
        console.log(err)
      })
    })
  },

  getDir (path) {
    return fsPromise.readdir(path)
  },

  readFile (path) {
    return fsPromise.readFile(path, { encoding: 'utf8' })
  },

  writeFile (path, content) {
    return fsPromise.writeFile(path, content, { encoding: 'utf8' })
  },

  exec (cmd, logFn, regExp) {
    const command = typeof cmd === 'string' ? cmd : cmd.join(' && ')

    return new Promise((resolve, reject) => {
      const child = spawn(command, { shell: true })
      child.stdout.setEncoding('utf8')
      child.stderr.setEncoding('utf8')

      child.stdout.on('data', data => {
        const message = data.toString()
        logFn && logFn(message)
        if (regExp) {
          let matches
          if (matches = message.match(new RegExp(regExp, 'i'))) {
            resolve({ child, matches })
          }
        }
      })

      child.stderr.on('data', data => {
        logFn && logFn(data.toString())
      })

      child.on('close', code => {
        logFn && logFn(`pid: ${child.pid} 子进程结束，code: ${code}`)
        if (code === 0) {
          logFn && logFn(`运行成功 ${command}`)
          resolve(0)
        } else {
          // logFn && logFn(`命令运行失败 ${command}，错误码: ${code}`)
          reject(code)
        }
      })
    })
  },

  reg (str) {
    return new RegExp(`// ${str}-start([\\s\\S]+)// ${str}-end`)
  }
}
