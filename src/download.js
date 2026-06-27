'use strict'

/*
  Download kubo distribution package for desired version, platform and architecture,
  and unpack it to a desired output directory.

  API:
    download(<version>, <platform>, <arch>, <outputPath>)

  Defaults:
    kubo version: value in package.json/kubo/version
    kubo platform: the platform this program is run from
    kubo architecture: the architecture of the hardware this program is run from
    kubo install path: './kubo'
*/
const goenv = require('./go-platform')
const gunzip = require('gunzip-maybe')
const got = require('got').default
const path = require('path')
const tarFS = require('tar-fs')
const unzip = require('unzip-stream')
const pkgConf = require('pkg-conf')
// @ts-ignore no types
const cachedir = require('cachedir')
const pkg = require('../package.json')
const fs = require('fs')
const hasha = require('hasha')
const cproc = require('child_process')
const isWin = process.platform === 'win32'

const DEFAULT_RELEASES_URL = 'https://github.com/ipfs/kubo/releases'

/**
 * avoid expensive fetch if file is already in cache
 * @param {string} url
 */
async function cachingFetchAndVerify (url) {
  const cacheDir = process.env.NPM_KUBO_CACHE || process.env.NPM_GO_IPFS_CACHE || cachedir('npm-kubo')
  const filename = url.split('/').pop()

  if (!filename) {
    throw new Error('Invalid URL')
  }

  const cachedFilePath = path.join(cacheDir, filename)
  const cachedHashPath = `${cachedFilePath}.sha512`

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }
  if (!fs.existsSync(cachedFilePath)) {
    console.info(`Downloading ${url} to ${cacheDir}`)
    // Fetch the archive and its checksum first, then write them. Write the
    // checksum, then put the archive in place with a temp file and a rename, so
    // the archive (what the cache check looks for) only shows up once it is
    // complete. A failed download or write then leaves nothing behind, instead
    // of an archive with no checksum that breaks every later run.
    const archive = await got(url).buffer()
    const checksum = await got(`${url}.sha512`).buffer()
    fs.writeFileSync(cachedHashPath, checksum)
    const partFile = `${cachedFilePath}.part`
    fs.writeFileSync(partFile, archive)
    fs.renameSync(partFile, cachedFilePath)
    console.info(`Downloaded ${url}`)
  } else {
    console.info(`Found ${cachedFilePath}`)
  }

  console.info(`Verifying ${filename}.sha512`)

  const digest = Buffer.alloc(128)
  const fd = fs.openSync(cachedHashPath, 'r')
  fs.readSync(fd, digest, 0, digest.length, 0)
  fs.closeSync(fd)
  const expectedSha = digest.toString('utf8')
  const calculatedSha = await hasha.fromFile(cachedFilePath, { encoding: 'hex', algorithm: 'sha512' })
  if (calculatedSha !== expectedSha) {
    console.log(`Expected   SHA512: ${expectedSha}`)
    console.log(`Calculated SHA512: ${calculatedSha}`)
    throw new Error(`SHA512 of ${cachedFilePath}' (${calculatedSha}) does not match expected value from ${cachedFilePath}.sha512 (${expectedSha})`)
  }
  console.log(`OK (${expectedSha})`)

  return fs.createReadStream(cachedFilePath)
}

/**
 * @param {string} url
 * @param {string} installPath
 * @param {import('stream').Readable} stream
 */
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

/**
 * @param {string} [version]
 * @param {string} [platform]
 * @param {string} [arch]
 * @param {string} [installPath]
 */
function cleanArguments (version, platform, arch, installPath) {
  const conf = pkgConf.sync('kubo', {
    cwd: process.env.INIT_CWD || process.cwd(),
    defaults: {
      version: 'v' + pkg.version.replace(/-[0-9]+/, ''),
      releasesUrl: DEFAULT_RELEASES_URL,
      distUrl: ''
    }
  })

  // KUBO_DIST_URL / GO_IPFS_DIST_URL / kubo.distUrl are the old dist.ipfs.tech
  // overrides. They still work via the legacy path in download(), so pass them
  // through here instead of rejecting them. distUrl is empty when none is set.
  return {
    version: process.env.TARGET_VERSION || version || conf.version,
    platform: process.env.TARGET_OS || platform || goenv.GOOS,
    arch: process.env.TARGET_ARCH || arch || goenv.GOARCH,
    distUrl: process.env.KUBO_DIST_URL || process.env.GO_IPFS_DIST_URL || conf.distUrl,
    releasesUrl: process.env.KUBO_RELEASES_URL || conf.releasesUrl,
    installPath: installPath ? path.resolve(installPath) : process.cwd()
  }
}

/**
 * Build the GitHub release asset URL. The download itself validates that the
 * asset exists (a missing release asset returns 404), so no version index or
 * manifest is fetched.
 *
 * @param {string} version
 * @param {string} platform
 * @param {string} arch
 * @param {string} releasesUrl
 */
function getDownloadURL (version, platform, arch, releasesUrl) {
  const base = releasesUrl.replace(/\/+$/, '')
  const extension = platform === 'windows' ? 'zip' : 'tar.gz'
  const asset = `kubo_${version}_${platform}-${arch}.${extension}`
  return `${base}/download/${version}/${asset}`
}

/**
 * Check that a version exists on a dist.ipfs.tech-style server. Used only by the
 * deprecated KUBO_DIST_URL path.
 *
 * @param {string} version
 * @param {string} distUrl
 */
async function ensureVersion (version, distUrl) {
  const versions = (await got(`${distUrl}/kubo/versions`).text()).trim().split('\n')

  if (versions.indexOf(version) === -1) {
    throw new Error(`Version '${version}' not available`)
  }
}

/**
 * Resolve the asset URL from a dist.ipfs.tech-style server (the dist.json
 * layout). Used only by the deprecated KUBO_DIST_URL path.
 *
 * @param {string} version
 * @param {string} platform
 * @param {string} arch
 * @param {string} distUrl
 */
async function getLegacyDownloadURL (version, platform, arch, distUrl) {
  await ensureVersion(version, distUrl)

  const data = await got(`${distUrl}/kubo/${version}/dist.json`).json()

  if (!data.platforms[platform]) {
    throw new Error(`No binary available for platform '${platform}'`)
  }

  if (!data.platforms[platform].archs[arch]) {
    throw new Error(`No binary available for arch '${arch}'`)
  }

  const link = data.platforms[platform].archs[arch].link
  return `${distUrl}/kubo/${version}${link}`
}

let warnedDistUrlDeprecation = false

// Tell the user once that the dist.ipfs.tech overrides are deprecated, and how
// to switch to KUBO_RELEASES_URL.
function warnDeprecatedDistUrl () {
  if (warnedDistUrlDeprecation) {
    return
  }
  warnedDistUrlDeprecation = true
  console.error([
    'kubo: KUBO_DIST_URL, GO_IPFS_DIST_URL and the kubo.distUrl config are deprecated.',
    'They still work and keep using the old dist.ipfs.tech layout, but please switch',
    'to KUBO_RELEASES_URL. It works with GitHub releases and any HTTP mirror of them.',
    `Example: KUBO_RELEASES_URL=${DEFAULT_RELEASES_URL}`
  ].join('\n'))
}

/**
 * Check whether a release exists for this version, so a missing asset can be
 * told apart from a missing release. Best effort: returns false if the check
 * itself fails (for example a mirror with no tag page).
 *
 * @param {string} version
 * @param {string} releasesUrl
 */
async function releaseExists (version, releasesUrl) {
  const base = releasesUrl.replace(/\/+$/, '')
  try {
    await got(`${base}/tag/${version}`, { method: 'HEAD' })
    return true
  } catch (err) {
    return false
  }
}

/**
 * @param {object} options
 * @param {string} options.version
 * @param {string} options.platform
 * @param {string} options.arch
 * @param {string} options.installPath
 * @param {string} [options.releasesUrl]
 * @param {string} [options.distUrl] deprecated dist.ipfs.tech-style base
 */
async function download ({ version, platform, arch, installPath, releasesUrl = DEFAULT_RELEASES_URL, distUrl }) {
  let url
  if (distUrl) {
    warnDeprecatedDistUrl()
    url = await getLegacyDownloadURL(version, platform, arch, distUrl)
  } else {
    url = getDownloadURL(version, platform, arch, releasesUrl)
  }

  let data
  try {
    data = await cachingFetchAndVerify(url)
  } catch (err) {
    const e = /** @type {{ response?: { statusCode?: number } }} */ (err)
    if (e.response && e.response.statusCode === 404 && !distUrl) {
      if (await releaseExists(version, releasesUrl)) {
        throw new Error(`kubo ${version} is released, but it has no ${platform}-${arch} file. Your platform may be unsupported, or the release may still be publishing. If this is a new version, wait a few hours and try again. (${url})`)
      }
      throw new Error(`kubo ${version} is not available: there is no ${version} release. (${url})`)
    }
    throw err
  }

  await unpack(url, installPath, data)
  console.info(`Unpacked ${installPath}`)

  return path.join(installPath, 'kubo', `ipfs${platform === 'windows' ? '.exe' : ''}`)
}

/**
 * @param {object} options
 * @param {string} options.depBin
 * @param {string} options.version
 */
async function link ({ depBin, version }) {
  let localBin = path.resolve(path.join(__dirname, '..', 'bin', 'ipfs'))

  if (isWin) {
    if (fs.existsSync(localBin)) {
      fs.unlinkSync(localBin)
    }
    localBin += '.exe'
  }

  if (!fs.existsSync(depBin)) {
    throw new Error('ipfs binary not found. maybe kubo did not install correctly?')
  }

  if (fs.existsSync(localBin)) {
    fs.unlinkSync(localBin)
  }

  console.info('Linking', depBin, 'to', localBin)
  try {
    fs.symlinkSync(depBin, localBin)
  } catch (err) {
    // Try to recover when creating symlink on modern Windows fails (https://github.com/ipfs/npm-kubo/issues/68)
    if (isWin && typeof err === 'object' && err !== null && 'code' in err && err.code === 'EPERM') {
      console.info('Symlink creation failed due to insufficient privileges. Attempting to copy file instead...')
      try {
        fs.copyFileSync(depBin, localBin)
        console.info('Copying', depBin, 'to', localBin)
      } catch (copyErr) {
        console.error('File copy also failed:', copyErr)
        throw copyErr
      }
    } else {
      throw err
    }
  }

  if (isWin) {
    // On Windows, update the shortcut file to use the .exe
    const cmdFile = path.join(__dirname, '..', '..', 'ipfs.cmd')

    fs.writeFileSync(cmdFile, `@ECHO OFF
  "%~dp0\\node_modules\\kubo\\bin\\ipfs.exe" %*`)
  }

  // test ipfs installed correctly.
  var result = cproc.spawnSync(localBin, ['version'])
  if (result.error) {
    throw new Error('ipfs binary failed: ' + result.error)
  }

  var outstr = result.stdout.toString()
  var m = /ipfs version ([^\n]+)\n/.exec(outstr)

  if (!m) {
    throw new Error('Could not determine IPFS version')
  }

  var actualVersion = `v${m[1]}`

  if (actualVersion !== version) {
    throw new Error(`version mismatch: expected ${version} got ${actualVersion}`)
  }

  return localBin
}

module.exports.download = download

/**
 * @param {string} [version]
 * @param {string} [platform]
 * @param {string} [arch]
 * @param {string} [installPath]
 */
module.exports.downloadAndUpdateBin = async (version, platform, arch, installPath) => {
  const args = cleanArguments(version, platform, arch, installPath)

  return link({
    ...args,
    depBin: await download(args)
  })
}
