# install go-ipfs from npm

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://ipn.io) [![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/) [![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs) [![Dependency Status](https://david-dm.org/ipfs/npm-go-ipfs.svg?style=flat-square)](https://david-dm.org/ipfs/npm-go-ipfs)

Install the latest [go-ipfs](https://github.com/ipfs/go-ipfs/) binary.

```
npm install -g go-ipfs
```

Installs from [https://gobuilder.me/github.com/ipfs/go-ipfs/cmd/ipfs](https://gobuilder.me/github.com/ipfs/go-ipfs/cmd/ipfs).


## Usage

```sh
> npm install -g go-ipfs
> ipfs version
ipfs version 0.3.9

> npm install go-ipfs
> node_modules/.bin/ipfs
ipfs version 0.3.9
```

See [IPFS getting-started](http://ipfs.io/docs/getting-started). If anything goes wrong, try using: [http://ipfs.io/docs/install](http://ipfs.io/docs/install).

Warning: this module uses the _latest_ version of ipfs. If there is a strong need to vendor an older version, let us know. We care about versions very much :(  but for a number of reasons, this is easier for us all right now.


## Development

**Warning**: the file `bin/ipfs` is a placeholder, when downloading stuff, it gets replaced. so if you run `node install.js` it will then be dirty in the git repo. **Do not commit this file**, as then you would be commiting a big binary and publishing it to npm. (**TODO: add a pre-commit or pre-publish hook that warns about this**)
