# npm-go-ipfs

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![Dependency Status](https://david-dm.org/ipfs/npm-go-ipfs.svg?style=flat-square)](https://david-dm.org/ipfs/npm-go-ipfs)

> install go-ipfs from npm

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Development](#development)
  - [Publish a new version](#publish-a-new-version)
- [Contribute](#contribute)
- [License](#license)

## Install

Install the latest [go-ipfs](https://github.com/ipfs/go-ipfs/) binary.

```
npm install -g go-ipfs
```

Installs from [https://gobuilder.me/github.com/ipfs/go-ipfs/cmd/ipfs](https://gobuilder.me/github.com/ipfs/go-ipfs/cmd/ipfs).

## Usage

```sh
> npm install -g go-ipfs
> ipfs version
ipfs version 0.4.15

> npm install go-ipfs
> node_modules/.bin/ipfs
ipfs version 0.4.15
```

See [IPFS getting-started](http://ipfs.io/docs/getting-started). If anything goes wrong, try using: [http://ipfs.io/docs/install](http://ipfs.io/docs/install).

Warning: this module uses the _latest_ version of ipfs. If there is a strong need to vendor an older version, let us know. We care about versions very much :(  but for a number of reasons, this is easier for us all right now.


## Development

**Warning**: the file `bin/ipfs` is a placeholder, when downloading stuff, it gets replaced. so if you run `node install.js` it will then be dirty in the git repo. **Do not commit this file**, as then you would be commiting a big binary and publishing it to npm. (**TODO: add a pre-commit or pre-publish hook that warns about this**)

### Publish a new version

You should be able to just run `./publish.sh` for example:

```sh
> ./publish.sh
usage ./publish.sh <version>
publish a version of go-ipfs to npm

> ./publish.sh 0.3.11
```

This will:

- check the version is indeed a tag in https://github.com/ipfs/go-ipfs
- check the size of `bin/ipfs` is right (must be the checked in file)
- update the version numbers in `package.json` and `README.md`
- `git commit` the changes
- push to https://github.com/ipfs/npm-go-ipfs
- publish to `go-ipfs@$version` to https://npmjs.com/package/go-ipfs

Open an issue in the repo if you run into trouble.

### Publish a new version of this module with exact same go-ipfs version

If some problem happens, and you need to publish a new version of this module targetting _the same_ go-ipfs version, then please follow this convention:

1. **Clean up bad stuff:** unpublish all modules with this exact same `<go-ipfs-version>`
2. **Add a "hacky" version suffix:** use version: `<go-ipfs-version>-hacky<num>`
3. **Publish version:** publish the module. Since it's the only one with the go-ipfs version, then it should be installed.

> Why do this?

Well, if you previously published npm module `go-ipfs@0.4.0` and there was a problem, we now must publish a different version, but we want to keep the version number the same. so the strategy is to publish as `go-ipfs@0.4.0-hacky1`, and unpublish `go-ipfs@0.4.0`.

> Why `-hacky<num>`?

Because it is unlikely to be a legitimate go-ipfs version, and we want to support go-ipfs versions like `floodsub-1` etc.

> Do i have to say `-hacky<num>` or can i just use `-<num>`?

`-<num>` won't work, as [link-ipfs.js](./link-ipfs.js) expects `-hacky<num>`. If you want to
change the convention, go for it, and update this readme accordingly.

## Contribute

Feel free to join in. All welcome. Open an [issue](https://github.com/ipfs/npm-go-ipfs/issues)!

This repository falls under the IPFS [Code of Conduct](https://github.com/ipfs/community/blob/master/code-of-conduct.md).

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/contributing.md)

## License

[MIT](LICENSE)
