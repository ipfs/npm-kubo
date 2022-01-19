'use strict'

function getGoOs () {
  switch (process.platform) {
    case "sunos":
      return "solaris"
    case "win32":
      return "windows"
  }

  return process.platform
}

function getGoArch () {
  switch (process.arch) {
    case "ia32":
      return "386"
    case "x64":
      return "amd64"
    case "arm":
      return "arm"
    case "arm64":
      return "arm64"
  }

  return process.arch
}


module.exports = {
  GOOS: getGoOs(),
  GOARCH: getGoArch()
}
