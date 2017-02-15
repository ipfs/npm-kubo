#!/usr/bin/env node
// portable file size
if (process.argv.length !== 3) {
  process.stdout.write('usage: ./filesize.js <path>\n')
  process.stdout.write('return filesize of <path> (portably!)\n')
  process.exit(0)
}

function die (err) {
  process.stderr.write('error: ' + err)
  process.exit(1)
}

var fs = require('fs')
var path = process.argv[2]
fs.stat(path, function (err, stat) {
  if (err) return die(err)

  process.stdout.write('' + stat.size + '\n')
})
