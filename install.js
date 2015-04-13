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

var bin = path.join(__dirname, 'bin')
var tmp = path.join(__dirname, 'tmp')
var installPath = path.join(bin, 'ipfs')

mkdirp(tmp, function(err) {
  if (err) onerror(err)

  nugget(url, {target: filename, dir: tmp, resume: true, verbose: true}, function (err) {
    if (err) return onerror(err)

    extract(path.join(tmp, filename), {dir: tmp}, function (err) {
      if (err) return onerror(err)

      fs.rename(path.join(tmp, "ipfs", "ipfs"), installPath, function(err) {
        if (err) return onerror(err)
      })
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
