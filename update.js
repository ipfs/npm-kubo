#!/usr/bin/env node

var fs = require('fs')

// portable file size
if (process.argv.length !== 3) {
  process.stdout.write('usage: ./update.js <version>\n')
  process.stdout.write('update module to <version>\n')
  process.exit(0)
}

var version = process.argv[2]

var pFind = /^ {2}"version": "[^"]+",$/m
var pRep = '  "version": "' + version + '",'
fsReplace('package.json', pFind, pRep, function (err) {
  dieOnErr(err)
  console.log('updated package.json')
})

var rFind = /ipfs version [0-9.]+/g
var rRep = 'ipfs version ' + version
fsReplace('README.md', rFind, rRep, function (err) {
  dieOnErr(err)
  console.log('updated README.md')
})

function die (err) {
  process.stderr.write(err + '\n')
  process.exit(1)
}

function dieOnErr (err) {
  if (err) die(err)
}

function fsReplace (path, find, replace, cb) {
  fs.readFile(path, function (err, contents) {
    if (err) {
      err = new Error('failed to read ' + path + ': ' + err)
      return cb(err)
    }

    contents = contents.toString()
    var nc = contents.replace(find, replace)

    fs.writeFile(path, nc, function (err) {
      if (err) {
        err = new Error('failed to write ' + path + ': ' + err)
        return cb(err)
      }

      cb(null) // success.
    })
  })
}
