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

  getDir (path) {
    return fsPromise.readdir(path)
  },

  exec (cmd, endRegexp) {
    const command = typeof cmd === 'string' ? cmd : cmd.join(' && ')
    return new Promise((resolve, reject) => {
      // const tcp = net.createServer(socket => {
      //   socket.pipe(socket)
      const child = spawn(command, { shell: true })
      child.stdout.on('data', data => {
        // socket.write(data)
        console.log(data.toString())
        if (
          endRegexp &&
          (new RegExp(endRegexp, 'i')).test(data.toString())
        ) {
          resolve()
        }
      })
      child.stderr.on('data', data => {
        console.log(data.toString())
        // socket.write(data)
      })
      child.on('close', code => {
        // tcp.close()
        if (code === 0) {
          resolve()
        } else {
          reject(code)
        }
      })
      // })
      // tcp.listen(8124)
      // 连接
      // net.createConnection(8124, 'localhost')
    })
  }
}
