'use strict'

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const { download } = require('./download')

module.exports.download = download

const packageRoot = path.join(__dirname, '..')
const binaryLocations = [
  path.join(packageRoot, 'kubo', 'ipfs'),
  path.join(packageRoot, 'kubo', 'ipfs.exe')
]

// Returns the installed binary, or undefined if it has not been downloaded.
const findBinary = () => binaryLocations.find(file => fs.existsSync(file))

const NOT_FOUND_ERROR = 'kubo binary not found, it may not be installed or an error may have occurred during installation'

// Download and link the binary by running the installer in a child process.
// The installer is async, so running it this way keeps path() synchronous while
// reusing the same caching, checksum and symlink logic. From npm v12 on,
// install scripts are opt-in, so the binary usually arrives here on first use
// rather than from the postinstall script.
const installBinary = () => {
  execFileSync(process.execPath, [path.join(__dirname, 'post-install.js')], {
    cwd: packageRoot,
    // Send the installer's progress (download.js logs via console.info/log,
    // which go to stdout) to this process's stderr (fd 2), so a programmatic
    // path() keeps its own stdout clean for the value it returns.
    stdio: ['ignore', 2, 2],
    // Under Electron, process.execPath is Electron rather than node;
    // ELECTRON_RUN_AS_NODE runs the script as plain node. A normal node process
    // ignores it.
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
  })
}

/**
 * Resolve the path to the kubo binary, downloading it on first use when it has
 * not been installed yet.
 *
 * Set the KUBO_BINARY env var to use your own binary, or pass
 * { autoDownload: false } to resolve only an installed binary and throw when it
 * is missing.
 *
 * @param {{ autoDownload?: boolean }} [options]
 * @returns {string}
 */
module.exports.path = (options = {}) => {
  const { autoDownload = true } = options

  if (process.env.KUBO_BINARY) {
    return process.env.KUBO_BINARY
  }

  let binary = findBinary()

  if (!binary && autoDownload) {
    try {
      installBinary()
    } catch (err) {
      // The installer prints the underlying failure to stderr; surface the
      // same error consumers saw before on-demand download existed.
      throw new Error(NOT_FOUND_ERROR)
    }
    binary = findBinary()
  }

  if (!binary) {
    throw new Error(NOT_FOUND_ERROR)
  }

  return binary
}
