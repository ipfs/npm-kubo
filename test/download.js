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

  await t.rejects(downloadAndUpdateBin('bogusversion', 'linux'), /Error: Version 'bogusversion' not available/)

  t.end()
})

test('Returns an error when KUBO_DIST_URL is 404', async (t) => {
  await clean()

  process.env.KUBO_DIST_URL = 'https://dist.ipfs.tech/notfound'

  await t.rejects(downloadAndUpdateBin(), /404/)

  delete process.env.KUBO_DIST_URL

  t.end()
})

test('Returns an error when legacy GO_IPFS_DIST_URL is 404', async (t) => {
  await clean()

  process.env.GO_IPFS_DIST_URL = 'https://dist.ipfs.tech/notfound'

  await t.rejects(downloadAndUpdateBin(), /404/)

  delete process.env.GO_IPFS_DIST_URL

  t.end()
})

test('Path returns undefined when no binary has been downloaded', async (t) => {
  await clean()

  t.throws(detectLocation, /not found/, 'Path throws if binary is not installed')

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
    distUrl: 'https://dist.ipfs.tech',
    installPath: tempDir
  })
  console.log(kuboPath)
  const stats = await fs.stat(kuboPath)

  t.ok(stats, 'kubo was downloaded to installPath')

  t.end()
})
