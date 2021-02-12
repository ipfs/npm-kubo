'use strict'

/*
  Download go-ipfs distribution package for desired version, platform and architecture,
  and unpack it to a desired output directory.

  API:
    download(<version>, <platform>, <arch>, <outputPath>)

  Defaults:
    go-ipfs version: value in package.json/go-ipfs/version
    go-ipfs platform: the platform this program is run from
    go-ipfs architecture: the architecture of the hardware this program is run from
    go-ipfs install path: './go-ipfs'
*/
const goenv = require('go-platform')
const gunzip = require('gunzip-maybe')
const path = require('path')
const tarFS = require('tar-fs')
const unzip = require('unzip-stream')
const fetch = require('node-fetch')
const pkgConf = require('pkg-conf')
const pkg = require('../package.json')
const fs = require('fs')
const cproc = require('child_process')
const isWin = process.platform === 'win32'

function unpack (url, installPath, stream) {
  return new Promise((resolve, reject) => {
    if (url.endsWith('.zip')) {
      return stream.pipe(
        unzip
          .Extract({ path: installPath })
          .on('close', resolve)
          .on('error', reject)
      )
    }

    return stream
      .pipe(gunzip())
      .pipe(
        tarFS
          .extract(installPath)
          .on('finish', resolve)
          .on('error', reject)
      )
  })
}

function cleanArguments (version, platform, arch, installPath) {
  const conf = pkgConf.sync('go-ipfs', {
    cwd: process.env.INIT_CWD || process.cwd(),
    defaults: {
      version: 'v' + pkg.version.replace(/-[0-9]+/, ''),
      distUrl: 'https://dist.ipfs.io'
    }
  })

  return {
    version: process.env.TARGET_VERSION || version || conf.version,
    platform: process.env.TARGET_OS || platform || goenv.GOOS,
    arch: process.env.TARGET_ARCH || arch || goenv.GOARCH,
    distUrl: process.env.GO_IPFS_DIST_URL || conf.distUrl,
    installPath: installPath ? path.resolve(installPath) : process.cwd()
  }
}

async function ensureVersion (version, distUrl) {
  const res = await fetch(`${distUrl}/go-ipfs/versions`)
  console.info(`${distUrl}/go-ipfs/versions`)
  if (!res.ok) {
    throw new Error(`Unexpected status: ${res.status}`)
  }

  const versions = (await res.text()).trim().split('\n')

  if (versions.indexOf(version) === -1) {
    throw new Error(`Version '${version}' not available`)
  }
}

async function getDownloadURL (version, platform, arch, distUrl) {
  await ensureVersion(version, distUrl)

  const res = await fetch(`${distUrl}/go-ipfs/${version}/dist.json`)
  if (!res.ok) throw new Error(`Unexpected status: ${res.status}`)
  const data = await res.json()

  if (!data.platforms[platform]) {
    throw new Error(`No binary available for platform '${platform}'`)
  }

  if (!data.platforms[platform].archs[arch]) {
    throw new Error(`No binary available for arch '${arch}'`)
  }

  const link = data.platforms[platform].archs[arch].link
  return `${distUrl}/go-ipfs/${version}${link}`
}

async function download ({ version, platform, arch, installPath, distUrl }) {
  const url = await getDownloadURL(version, platform, arch, distUrl)

  console.info(`Downloading ${url}`)

  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Unexpected status: ${res.status}`)
  }

  console.info(`Downloaded ${url}`)

  await unpack(url, installPath, res.body)

  console.info(`Unpacked ${installPath}`)

  return path.join(installPath, 'go-ipfs', `ipfs${platform === 'windows' ? '.exe' : ''}`)
}

async function link ({ depBin, version }) {
  let localBin = path.resolve(path.join(__dirname, '..', 'bin', 'ipfs'))

  if (isWin) {
    localBin += '.exe'
  }

  if (!fs.existsSync(depBin)) {
    throw new Error('ipfs binary not found. maybe go-ipfs did not install correctly?')
  }

  if (fs.existsSync(localBin)) {
    fs.unlinkSync(localBin)
  }

  console.info('Linking', depBin, 'to', localBin)
  fs.symlinkSync(depBin, localBin)

  if (isWin) {
    // On Windows, update the shortcut file to use the .exe
    const cmdFile = path.join(__dirname, '..', '..', 'ipfs.cmd')

    fs.writeFileSync(cmdFile, `@ECHO OFF
  "%~dp0\\node_modules\\go-ipfs\\bin\\ipfs.exe" %*`)
  }

  // test ipfs installed correctly.
  var result = cproc.spawnSync(localBin, ['version'])
  if (result.error) {
    throw new Error('ipfs binary failed: ' + result.error)
  }

  var outstr = result.stdout.toString()
  var m = /ipfs version ([^\n]+)\n/.exec(outstr)
  var actualVersion = `v${m[1]}`

  if (actualVersion !== version) {
    throw new Error(`version mismatch: expected ${version} got ${actualVersion}`)
  }

  return localBin
}

module.exports = async (...args) => {
  args = cleanArguments(...args)

  return link({
    ...args,
    depBin: await download(args)
  })
}
