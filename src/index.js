'use strict'

const fs = require('fs')
const path = require('path')

module.exports.path = function () {
  if (process.env.KUBO_BINARY) {
    return process.env.KUBO_BINARY
  }

  const paths = [
    path.resolve(path.join(__dirname, '..', 'go-ipfs', 'ipfs')),
    path.resolve(path.join(__dirname, '..', 'go-ipfs', 'ipfs.exe'))
  ]

  for (const bin of paths) {
    if (fs.existsSync(bin)) {
      return bin
    }
  }

  throw new Error('go-ipfs binary not found, it may not be installed or an error may have occurred during installation')
}
