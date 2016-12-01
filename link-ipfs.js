'use strict'

var fs = require('fs')
var path = require('path')
var cproc = require('child_process')
var version = require('./package.json').version
version = version.replace(/-hacky[0-9]+/, "") // remove superfluous -suffix.

const depBin = path.join(__dirname, "node_modules", "go-ipfs-dep", "go-ipfs", "ipfs")
const localBin = path.join(__dirname, "bin", "ipfs")

if (!fs.existsSync(depBin)) {
  die("ipfs binary not found. maybe go-ipfs-dep did not install correctly?")
}

fs.unlinkSync(localBin)
fs.symlinkSync(depBin, localBin)

// test ipfs installed correctly.
var result = cproc.spawnSync(localBin, ["version"])
if (result.error) {
  die("ipfs binary failed: " + result.error)
}

var outstr = result.stdout.toString()
var m = /ipfs version ([^\n]+)\n/.exec(outstr)
var actualVersion = m[1]

if (actualVersion !== version) {
  die("version mismatch: expected " + version + " got " + actualVersion)
}

function die(err) {
  console.error(err)
  process.exit(1)
}
