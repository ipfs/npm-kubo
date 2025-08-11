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
    // download file
    fs.writeFileSync(cachedFilePath, await got(url).buffer())
    console.info(`Downloaded ${url}`)

    // ..and checksum
    console.info(`Downloading ${filename}.sha512`)
    fs.writeFileSync(cachedHashPath, await got(`${url}.sha512`).buffer())
    console.info(`Downloaded ${filename}.sha512`)
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
      distUrl: 'https://dist.ipfs.tech'
    }
  })

  return {
    version: process.env.TARGET_VERSION || version || conf.version,
    platform: process.env.TARGET_OS || platform || goenv.GOOS,
    arch: process.env.TARGET_ARCH || arch || goenv.GOARCH,
    distUrl: process.env.KUBO_DIST_URL || process.env.GO_IPFS_DIST_URL || conf.distUrl,
    installPath: installPath ? path.resolve(installPath) : process.cwd()
  }
}

/**
 * @param {string} version
 * @param {string} distUrl
 */
async function ensureVersion (version, distUrl) {
  console.info(`${distUrl}/kubo/versions`)
  const versions = (await got(`${distUrl}/kubo/versions`).text()).trim().split('\n')

  if (versions.indexOf(version) === -1) {
    throw new Error(`Version '${version}' not available`)
  }
}

/**
 * @param {string} version
 * @param {string} platform
 * @param {string} arch
 * @param {string} distUrl
 */
async function getDownloadURL (version, platform, arch, distUrl) {
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

/**
 * @param {object} options
 * @param {string} options.version
 * @param {string} options.platform
 * @param {string} options.arch
 * @param {string} options.installPath
 * @param {string} options.distUrl
 */
async function download ({ version, platform, arch, installPath, distUrl }) {
  const url = await getDownloadURL(version, platform, arch, distUrl)
  const data = await cachingFetchAndVerify(url)

  await unpack(url, installPath, data)
  console.info(`Unpacked ${installPath}`)

  return path.join(installPath, 'kubo', `ipfs${platform === 'windows' ? '.exe' : ''}`)
}

// Error codes that trigger fallback mechanisms
const FALLBACK_ERROR_CODES = ['EPERM', 'EACCES', 'ENOENT', 'EINVAL', 'ENOTDIR', 'EISDIR']

/**
 * Get error message from various error types
 * @param {unknown} err
 * @returns {string}
 */
function getErrorMessage (err) {
  if (err instanceof Error) {
    return err.message
  }
  return String(err)
}

/**
 * Safely unlink a file, logging warnings instead of throwing
 * @param {string} filePath
 */
function safeUnlink (filePath) {
  if (!fs.existsSync(filePath)) {
    return
  }

  try {
    fs.unlinkSync(filePath)
  } catch (err) {
    console.warn(`Could not remove ${filePath}: ${getErrorMessage(err)}`)
  }
}

/**
 * Ensure directory exists, creating it if necessary
 * @param {string} dirPath
 */
function ensureDirectory (dirPath) {
  if (fs.existsSync(dirPath)) {
    return
  }

  try {
    fs.mkdirSync(dirPath, { recursive: true })
  } catch (err) {
    const msg = `Failed to create directory at ${dirPath}: ${getErrorMessage(err)}`
    console.error(msg)
    throw new Error(msg)
  }
}

/**
 * Attempt to create a link using various methods
 * @param {string} source
 * @param {string} destination
 * @returns {boolean} true if successful
 */
function createLinkWithFallback (source, destination) {
  // Try symlink first
  try {
    fs.symlinkSync(source, destination)
    return true
  } catch (symlinkErr) {
    // @ts-ignore - error might have code property
    const errorCode = symlinkErr && symlinkErr.code

    if (!FALLBACK_ERROR_CODES.includes(errorCode)) {
      throw symlinkErr
    }

    console.info(`Symlink creation failed (${errorCode}). Attempting to copy file instead...`)
  }

  // Fallback to copy
  try {
    fs.copyFileSync(source, destination)
    console.info(`Successfully copied ${source} to ${destination}`)
    return true
  } catch (copyErr) {
    console.error(`Failed to copy ${source} to ${destination}: ${getErrorMessage(copyErr)}`)

    // Last resort: hard link
    try {
      fs.linkSync(source, destination)
      console.info(`Successfully created hard link from ${source} to ${destination}`)
      return true
    } catch (hardLinkErr) {
      console.error(`Hard link also failed: ${getErrorMessage(hardLinkErr)}`)
      return false
    }
  }
}

/**
 * @param {object} options
 * @param {string} options.depBin
 * @param {string} options.version
 */
async function link ({ depBin, version }) {
  let localBin = path.resolve(path.join(__dirname, '..', 'bin', 'ipfs'))
  const binDir = path.dirname(localBin)

  // Ensure bin directory exists
  ensureDirectory(binDir)

  // Handle Windows-specific logic
  if (isWin) {
    safeUnlink(localBin) // Remove non-.exe version if it exists
    localBin += '.exe'
  }

  // Verify source binary exists
  if (!fs.existsSync(depBin)) {
    throw new Error('ipfs binary not found. maybe kubo did not install correctly?')
  }

  // Remove existing destination
  safeUnlink(localBin)

  // Create the link
  console.info(`Linking ${depBin} to ${localBin}`)

  if (!createLinkWithFallback(depBin, localBin)) {
    throw new Error(`Unable to create symlink, copy, or hard link from ${depBin} to ${localBin}`)
  }

  // Windows-specific: create .cmd file
  if (isWin) {
    const cmdFile = path.join(__dirname, '..', '..', 'ipfs.cmd')
    const cmdContent = '@ECHO OFF\n"%~dp0\\node_modules\\kubo\\bin\\ipfs.exe" %*'

    try {
      fs.writeFileSync(cmdFile, cmdContent)
    } catch (err) {
      console.warn(`Could not create ipfs.cmd file: ${getErrorMessage(err)}`)
      // Non-critical, continue
    }
  }

  // Verify the binary works correctly
  const result = cproc.spawnSync(localBin, ['version'])
  if (result.error) {
    throw new Error(`ipfs binary failed: ${result.error}`)
  }

  const output = result.stdout.toString()
  const versionMatch = /ipfs version ([^\n]+)\n/.exec(output)

  if (!versionMatch) {
    throw new Error('Could not determine IPFS version')
  }

  const actualVersion = `v${versionMatch[1]}`
  if (actualVersion !== version) {
    throw new Error(`version mismatch: expected ${version} got ${actualVersion}`)
  }

  return localBin
}

/**
* @param {object} options
* @param {string} options.version
* @param {string} options.platform
* @param {string} options.arch
* @param {string} options.installPath
* @param {string} options.distUrl
*/
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
