const env = {}

switch (process.platform) {
  case "darwin":
  case "linux":
  case "freebsd":
    env.GOOS = process.platform
    break
  case "sunos":
    env.GOOS = "solaris"
    break
  case "win32":
    env.GOOS = "windows"
    break
}

switch (process.arch) {
  case "ia32":
    env.GOARCH = "386"
    break
  case "x64":
    env.GOARCH = "amd64"
    break
  case "arm":
    env.GOARCH = "arm"
  case "arm64":
    env.GOARCH = "arm64"
    break
}

module.exports = env
