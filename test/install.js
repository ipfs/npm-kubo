const fs = require('fs-extra')
const path = require('path')
const test = require('tape')
const execa = require('execa')

/*
  Test that go-ipfs is downloaded during npm install.
  - package up the current source code with `npm pack`
  - install the tarball into the example project
  - ensure that the "go-ipfs.version" prop in the package.json is used
*/

const testVersion = require('./fixtures/example-project/package.json')['go-ipfs'].version

async function clean () {
  await fs.remove(path.join(__dirname, 'fixtures', 'example-project', 'node_modules'))
  await fs.remove(path.join(__dirname, 'fixtures', 'example-project', 'package-lock.json'))
}

test.onFinish(clean)

test('Ensure go-ipfs.version defined in parent package.json is used', async (t) => {
  await clean()

  // from `example-project`, install the module
  const res = execa.sync('npm', ['install'], {
    cwd: path.join(__dirname, 'fixtures', 'example-project')
  })
  const msg = `Downloading https://dist.ipfs.io/go-ipfs/${testVersion}`
  t.ok(res.stdout.includes(msg), msg)
  t.end()
})
