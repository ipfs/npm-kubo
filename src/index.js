'use strict'

const fs = require('fs')
const path = require('path')
const { download } = require('./download')

module.exports.download = download

module.exports.path = function () {
  if (process.env.KUBO_BINARY) {
    return process.env.KUBO_BINARY
  }

  const paths = [
    path.resolve(path.join(__dirname, '..', 'kubo', 'ipfs')),
    path.resolve(path.join(__dirname, '..', 'kubo', 'ipfs.exe'))
  ]

  for (const bin of paths) {
    if (fs.existsSync(bin)) {
      return bin
    }
  }

  throw new Error('kubo binary not found, it may not be installed or an error may have occurred during installation')
}
