#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp');
var nugget = require('nugget')
var goenv = require('go-platform')
var extract = require('extract-zip')

checkPlatform(goenv) // make sure we can do this.

var filename = 'ipfs_master_' + goenv.GOOS + '-' + goenv.GOARCH + '.zip'
var url = 'https://gobuilder.me/get/github.com/ipfs/go-ipfs/cmd/ipfs/' + filename

var dist = path.join(__dirname, 'dist')
var installPath = path.join(dist, 'ipfs, ipfs')
var shebang = '#!/bin/sh\n'
var argv = '$@'
var script = shebang + installPath + ' ' + argv + '\n'


if (!argv) throw new Error('Unknown platform: ' + platform)

mkdirp(dist, function(err) {
  if (err) onerror(err)

  nugget(url, {target: filename, dir: dist, resume: true, verbose: true}, function (err) {
    if (err) return onerror(err)

    extract(path.join(dist, filename), {dir: dist}, function (err) {
      if (err) return onerror(err)
    })
  })
})

function onerror (err) {
  throw err
}

function checkPlatform(goenv) {
  switch (goenv.GOOS) {
  case "darwin":
  case "linux":
  case "freebsd":
    break

  default:
    throw new Error("no binary available for os:" + goenv.GOOS)
  }

  switch (goenv.GOARCH) {
  case "amd64":
  case "i386":
  case "arm":
    break

  default:
    throw new Error("no binary available for arch: " + goenv.GOARCH)
  }
}
