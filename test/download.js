'use strict'

const test = require('tape-promise').default(require('tape'))
const fs = require('fs-extra')
const download = require('../src/download')
const { path: detectLocation } = require('../')
const clean = require('./fixtures/clean')

test('Ensure ipfs gets downloaded (current version and platform)', async (t) => {
  await clean()

  const installPath = await download()
  const stats = await fs.stat(installPath)

  t.ok(stats, 'go-ipfs was downloaded')
  t.ok(installPath, detectLocation(), 'go-ipfs binary was detected')

  t.end()
})

test('Returns an error when version unsupported', async (t) => {
  await clean()

  await t.rejects(download('bogusversion', 'linux'), /Error: Version 'bogusversion' not available/)

  t.end()
})

test('Returns an error when dist url is 404', async (t) => {
  await clean()

  process.env.GO_IPFS_DIST_URL = 'https://dist.ipfs.tech/notfound'

  await t.rejects(download(), /404/)

  delete process.env.GO_IPFS_DIST_URL

  t.end()
})

test('Path returns undefined when no binary has been downloaded', async (t) => {
  await clean()

  t.throws(detectLocation, /not found/, 'Path throws if binary is not installed')

  t.end()
})
