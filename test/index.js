var test = require('tape')
var fs = require('fs')
var cp = require('child_process')
var ipfs = require('../')

test('ensure ipfs bin path exists', function(t) {
  t.plan(4)
  fs.stat(ipfs, function(err, stats) {
    t.error(err, 'ipfs bin should stat witout error')
    cp.exec([ipfs,'version'].join(' '), function(err, stdout, stderr) {
      t.error(err, 'ipfs runs without error')
      t.true(stdout.indexOf('ipfs version') >= 0, 'ipfs version retreived')
      t.false(stderr, 'no stderr output')
    })
  })
})
