'use strict'

const fs = require('fs')
const path = require('path')
const cproc = require('child_process')
const isWin = process.platform === 'win32'
const version = require('./package.json').version
  .replace(/-hacky[0-9]+/, '') // remove superfluous -suffix.

var depPath = require.resolve('go-ipfs-dep')
depPath = path.dirname(path.dirname(depPath)) // walk up ../../
var depBin = path.join(depPath, 'go-ipfs', 'ipfs')
var localBin = path.join(__dirname, 'bin', 'ipfs')

if (isWin) {
  depBin += '.exe'
  localBin += '.exe'
}

if (!fs.existsSync(depBin)) {
  die('ipfs binary not found. maybe go-ipfs-dep did not install correctly?')
}

if (fs.existsSync(localBin)) {
  fs.unlinkSync(localBin)
}

fs.symlinkSync(depBin, localBin)

if (isWin) {
  // On Windows, update the shortcut file to use the .exe
  let cmdFile = path.join(__dirname, '..', '..', 'ipfs.cmd')

  fs.writeFileSync(cmdFile, `@ECHO OFF
"%~dp0\\node_modules\\go-ipfs\\bin\\ipfs.exe" %*`)
}

// test ipfs installed correctly.
var result = cproc.spawnSync(localBin, ['version'])
if (result.error) {
  die('ipfs binary failed: ' + result.error)
}

var outstr = result.stdout.toString()
var m = /ipfs version ([^\n]+)\n/.exec(outstr)
var actualVersion = m[1]

if (actualVersion !== version) {
  die('version mismatch: expected ' + version + ' got ' + actualVersion)
}

function die (err) {
  console.error(err)
  process.exit(1)
}
