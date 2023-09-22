<h1 align="center">
  <br>
  <a href="https://docs.ipfs.tech/how-to/command-line-quick-start/"><img src="https://user-images.githubusercontent.com/157609/250148884-d6d12db8-fdcf-4be3-8546-2550b69845d8.png" alt="Kubo logo" title="Kubo logo" width="200"></a>
  <br>
  Kubo: IPFS Implementation in GO
  <br>
  <br>
</h1>

<h4 align="center">Install <a href="https://github.com/ipfs/kubo">Kubo</a> (previously known as "go-ipfs") from <a href="https://www.npmjs.com/package/kubo">NPM</a></h4>

<p align="center">
  <a href="https://matrix.to/#/#ipfs-space:ipfs.io"><img alt="Matrix" src="https://img.shields.io/matrix/ipfs-space%3Aipfs.io?server_fqdn=matrix.org"></a>
  <a href="https://github.com/ipfs/npm-kubo/actions"><img src="https://img.shields.io/github/actions/workflow/status/ipfs/npm-kubo/main.yml?branch=master" alt="ci"></a>
  <a href="https://www.npmjs.com/package/kubo"><img src="https://img.shields.io/npm/v/kubo" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/kubo"><img src="https://img.shields.io/npm/dm/kubo.svg" alt="npm downloads"></a>
  <a href="https://ipfs.tech"><img src="https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square" alt="Official Part of IPFS Project"></a>
</p>

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Development](#development)
  - [Publish a new version](#publish-a-new-version)
- [Contribute](#contribute)
- [License](#license)

## Install

Install the latest [Kubo](https://github.com/ipfs/kubo/) (go-ipfs) binary:

```sh
# Install globally
> npm install -g kubo
> ipfs version
ipfs version v0.23.0

# Install locally
> npm install kubo
> ./node_modules/.bin/ipfs
ipfs version v0.23.0
```

## Usage

This module downloads Kubo (go-ipfs) binaries from https://dist.ipfs.tech into your project.

It will download the kubo version that matches the npm version of this module. So depending on `kubo@0.23.0` will install `kubo v0.23.0` for your current system architecture, in to your project at `node_modules/kubo/kubo/ipfs` and additional symlink to it at `node_modules/kubo/bin/ipfs`.

After downloading you can find out the path of the installed binary by calling the `path` function exported by this module:

```javascript
const { path } = require('kubo')

console.info('kubo is installed at', path())
```

An error will be thrown if the path to the binary cannot be resolved.

### Caching

Downloaded archives are placed in OS-specific cache directory which can be customized by setting `NPM_KUBO_CACHE` in env.

### Overriding with `KUBO_BINARY` env

If the `KUBO_BINARY` env variable is set at runtime this will override the path of the binary used.

This must point to the file, not the directory containing the file.

## Development

**Warning**: the file `bin/ipfs` is a placeholder, when downloading stuff, it gets replaced. so if you run `node install.js` it will then be dirty in the git repo. **Do not commit this file**, as then you would be commiting a big binary and publishing it to npm. A pre-commit hook exists and should protect against this, but better safe than sorry.

### Publish a new version

You should be able to just run `./publish.sh` for example:

```sh
> ./publish.sh
usage ./publish.sh <version>
publish a version of kubo to npm

> ./publish.sh 0.3.11
```

This will:

- check the version is indeed a tag in https://github.com/ipfs/kubo
- check the size of `bin/ipfs` is right (must be the checked in file)
- update the version numbers in `package.json` and `README.md`
- `git commit` the changes
- push to https://github.com/ipfs/npm-kubo
- publish to `kubo@$version` to https://npmjs.com/package/kubo

Open an issue in the repo if you run into trouble.

### Publish a new version of this module with exact same kubo version

If some problem happens, and you need to publish a new version of this module targetting _the same_ kubo version, then please follow this convention:

1. **Clean up bad stuff:** unpublish all modules with this exact same `<kubo-version>`
2. **Add a "hacky" version suffix:** use version: `<kubo-version>-hacky<num>`
3. **Publish version:** publish the module. Since it's the only one with the kubo version, then it should be installed.

> Why do this?

Well, if you previously published npm module `kubo@0.4.0` and there was a problem, we now must publish a different version, but we want to keep the version number the same. so the strategy is to publish as `kubo@0.4.0-hacky1`, and unpublish `kubo@0.4.0`.

> Why `-hacky<num>`?

Because it is unlikely to be a legitimate kubo version, and we want to support kubo versions like `floodsub-1` etc.

> Do i have to say `-hacky<num>` or can i just use `-<num>`?

`-<num>` won't work, as [link-ipfs.js](./link-ipfs.js) expects `-hacky<num>`. If you want to
change the convention, go for it, and update this readme accordingly.

## Contribute

Feel free to join in. All welcome. Open an [issue](https://github.com/ipfs/npm-kubo/issues)!

This repository falls under the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/contributing.md)

## License

[MIT](LICENSE)
