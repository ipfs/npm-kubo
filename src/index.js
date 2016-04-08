var path = require('path')
var goenv = require('go-platform')
var version = require('./../package.json').version
var request = require('request')
var gunzip = require('gunzip-maybe')
var tarFS = require('tar-fs')

module.exports = function (callback) {
  checkPlatform(goenv) // make sure we can do this.

  // hacky hack hack to work around unpublishability
  version = version.replace(/-[0-9]+/, '')

  var filename = 'ipfs_v' + version + '_' + goenv.GOOS + '-' + goenv.GOARCH + '.tar.gz'
  var url = 'http://dist.ipfs.io/go-ipfs/v' + version + '/go-' + filename

  var installPath = path.resolve(__dirname, '..')

  request
    .get(url)
    .pipe(gunzip())
    .pipe(
        tarFS
          .extract(installPath)
          .on('finish', callback)
        )

  function checkPlatform (goenv) {
    switch (goenv.GOOS) {
      case 'darwin':
      case 'linux':
      case 'freebsd':
        break
      default:
        throw new Error('no binary available for os:' + goenv.GOOS)
    }

    switch (goenv.GOARCH) {
      case 'amd64':
      case '386':
      case 'arm':
        break

      default:
        throw new Error('no binary available for arch: ' + goenv.GOARCH)
    }
  }
}
