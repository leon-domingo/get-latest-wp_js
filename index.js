const http = require('https')
const fs = require('fs')

const URL_GET_VERSION = 'https://api.wordpress.org/core/version-check/1.7/'
const URL_GET_WP      = 'https://es.wordpress.org/latest-es_ES.tar.gz'

const downloadWp = (file, fileName) => {
  return function(res) {
    const contentLength = parseInt(res.headers['content-length'], 10)
    let progress = 0
    let percentage = 0

    res.pipe(file)

    res.on('data', (chunk) => {
      // compute progress
      const chunkSize = Buffer.byteLength(chunk)
      progress += chunkSize

      const currentPercentage = Math.trunc((progress / contentLength) * 100)
      if (percentage !== currentPercentage) {
        if (percentage % 4 === 0) process.stdout.write('#');
        percentage = currentPercentage
      }
    })

    res.on('end', () => {
      console.info(`\n${fileName} was successfully downloaded!`)
    }).on('error', err => {
      console.error(err)
    })
  }
} // downloadWp

console.log('Checking the last version of Wordpress...')
http.get(URL_GET_VERSION, (res) => {

  if (res.statusCode !== 200) {
    console.error(`ERROR on checking version: ${res.statusCode} ${res.statusMessage}`)
  }
  else {
    res.setEncoding('utf8')

    let rawData = ''
    res.on('data', chunk => {
      rawData += chunk
    })

    res.on('end', () => {
      try {
        const parsedData = JSON.parse(rawData)
        const version = parsedData['offers'][0]['current']

        const fileName = `wordpress-${version}-es_ES.tar.gz`
        const latestVersionFile = fs.createWriteStream(`./${fileName}`)

        console.log(`Downloading Wordpress v${version} ...`)
        http.get(URL_GET_WP, downloadWp(latestVersionFile, fileName))
      }
      catch (err) {
        console.error(err)
      }
    }).on('error', err => {
      console.error(err)
    })
  }

}).on('error', err => {
  console.error(err)
})
