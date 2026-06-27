'use strict'

const test = require('tape-promise').default(require('tape'))
const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const { download, downloadAndUpdateBin } = require('../src/download')
const { path: detectLocation } = require('../')
const clean = require('./fixtures/clean')

test('Ensure ipfs gets downloaded (current version and platform)', async (t) => {
  await clean()

  const installPath = await downloadAndUpdateBin()
  const stats = await fs.stat(installPath)

  t.ok(stats, 'kubo was downloaded')
  t.ok(installPath, detectLocation(), 'kubo binary was detected')

  t.end()
})

test('Returns an error when version unsupported', async (t) => {
  await clean()

  await t.rejects(downloadAndUpdateBin('bogusversion', 'linux'), /kubo bogusversion is not available/)

  t.end()
})

test('KUBO_DIST_URL still works via the legacy layout and warns', async (t) => {
  await clean()

  process.env.KUBO_DIST_URL = 'https://github.com/ipfs/kubo/notfound'
  const warnings = []
  const realError = console.error
  console.error = (...args) => warnings.push(args.join(' '))

  try {
    // The base 404s, so the legacy /kubo/versions lookup fails fast; we only
    // need to confirm the legacy path ran and printed the deprecation warning.
    await t.rejects(downloadAndUpdateBin('v0.0.0'))
  } finally {
    console.error = realError
    delete process.env.KUBO_DIST_URL
  }

  t.ok(warnings.some(w => /deprecated/.test(w)), 'prints a deprecation warning')

  t.end()
})

test('A released version with no asset for this platform says so', async (t) => {
  await clean()

  // v0.42.0 exists but ships no plan9 build, so the asset 404s while the
  // release tag is present.
  await t.rejects(downloadAndUpdateBin('v0.42.0', 'plan9'), /no plan9-.* file/)

  t.end()
})

test('Path throws when no binary is present and autoDownload is disabled', async (t) => {
  await clean()

  t.throws(() => detectLocation({ autoDownload: false }), /not found/, 'Path throws if binary is not installed')

  t.end()
})

test('Path downloads the binary on first call when it is missing', async (t) => {
  await clean()

  const binPath = detectLocation()
  const stats = await fs.stat(binPath)

  t.ok(stats, 'kubo binary was downloaded on first path() call')

  t.end()
})

test('Path throws a clean error when an on-demand download fails', async (t) => {
  await clean()

  process.env.TARGET_VERSION = 'v0.0.0-notfound'

  t.throws(() => detectLocation(), /not found/, 'Path throws the kubo-binary-not-found error when the download fails')

  delete process.env.TARGET_VERSION

  t.end()
})

test('Ensure calling download function manually with static values works', async (t) => {
  await clean()

  const { version } = require('../package.json')
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temp-dir-'))

  console.log(tempDir)
  const kuboPath = await download({
    version: `v${version}`,
    platform: 'darwin',
    arch: 'arm64',
    releasesUrl: 'https://github.com/ipfs/kubo/releases',
    installPath: tempDir
  })
  console.log(kuboPath)
  const stats = await fs.stat(kuboPath)

  t.ok(stats, 'kubo was downloaded to installPath')

  t.end()
})
