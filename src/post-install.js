'use strict'

const download = require('./download')

download()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
