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
  <a href="https://ipfs.tech"><img src="https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square" alt="Official Part of IPFS Project"></a>
  <a href="https://discuss.ipfs.tech"><img alt="Discourse Forum" src="https://img.shields.io/discourse/posts?server=https%3A%2F%2Fdiscuss.ipfs.tech"></a>
  <a href="https://matrix.to/#/#ipfs-space:ipfs.io"><img alt="Matrix" src="https://img.shields.io/matrix/ipfs-space%3Aipfs.io?server_fqdn=matrix.org"></a>
  <a href="https://github.com/ipfs/npm-kubo/actions"><img src="https://img.shields.io/github/actions/workflow/status/ipfs/npm-kubo/main.yml?branch=master" alt="ci"></a>
  <a href="https://www.npmjs.com/package/kubo"><img src="https://img.shields.io/npm/v/kubo" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/kubo"><img src="https://img.shields.io/npm/dm/kubo.svg" alt="npm downloads"></a>
</p>

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Development](#development)
  - [Publish a new version](#publish-a-new-version)
    - [Authentication (npm Trusted Publishing)](#authentication-npm-trusted-publishing)
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

On Windows, `ipfs.exe` file is used, and if the symlink can't be created under a regular user, a copy of `ipfs.exe` is created instead.

After downloading you can find out the path of the installed binary by calling the `path` function exported by this module:

```javascript
import { path } from 'kubo'

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

Publishing is automated. The [`Release to npm`](./.github/workflows/main.yml) workflow runs hourly, checks `https://dist.ipfs.tech/kubo/versions` for a new release, and if one is found:

- bumps `version` in `package.json` via `npm version`
- publishes to npm as `kubo@<version>` with a [sigstore provenance attestation](https://docs.npmjs.com/generating-provenance-statements)
- pushes the version commit and tag back to `master`

The workflow tags full kubo releases as `latest` and pre-releases (any version containing `-`, e.g. `0.41.0-rc2`) as `next`.

Maintainers can also trigger a run manually from the [Actions tab](https://github.com/ipfs/npm-kubo/actions/workflows/main.yml) via `workflow_dispatch`.

#### Authentication (npm Trusted Publishing)

The workflow authenticates to npm via [Trusted Publishing](https://docs.npmjs.com/trusted-publishers) over GitHub OIDC, not a long-lived `NPM_AUTH_TOKEN`. To (re)configure trust on npmjs.com, a maintainer with publish rights should:

1. Go to the [`kubo` package settings on npmjs.com](https://www.npmjs.com/package/kubo/access) → **Trusted Publishers** → **Add trusted publisher** → **GitHub Actions**.
2. Set organization `ipfs`, repository `npm-kubo`, workflow filename `main.yml`. Leave the environment field blank.

## Contribute

Feel free to join in. All welcome. Open an [issue](https://github.com/ipfs/npm-kubo/issues)!

This repository falls under the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/contributing.md)

## License

[MIT](LICENSE)
