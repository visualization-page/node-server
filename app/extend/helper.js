const download = require('download-git-repo')
const { spawn } = require('child_process')
// const net = require('net')

module.exports = {
  downloadRepo (repoName, dest, owner = 'visualization-page') {
    return new Promise((resolve, reject) => {
      download(`${owner}/${repoName}`, dest, err => {
        if (err) reject(err)
        else resolve()
      })
    })
  },

  exec (cmd) {
    const command = (typeof cmd === 'string' ? [cmd] : cmd).join(' && ')
    return new Promise((resolve, reject) => {
      // const tcp = net.createServer(socket => {
      //   socket.pipe(socket)
      const childProcess = spawn(command, { shell: true })
      childProcess.stdout.on('data', data =>
        // socket.write(data)
        console.log(data.toString())
      )
      childProcess.stderr.on('data', data =>
        console.log(data.toString())
        // socket.write(data)
      )
      childProcess.on('close', code => {
        // tcp.close()
        if (code === 0) {
          resolve()
        } else {
          reject()
        }
      })
      // })
      // tcp.listen(8124)
      // 连接
      // net.createConnection(8124, 'localhost')
    })
  }
}
