'use strict'

const { downloadAndUpdateBin } = require('./download')

downloadAndUpdateBin()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
