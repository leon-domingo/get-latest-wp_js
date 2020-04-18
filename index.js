const http = require('https')
const fs = require('fs')

const URL_GET_VERSION = 'https://api.wordpress.org/core/version-check/1.7/'
const URL_GET_WP      = 'https://es.wordpress.org/latest-es_ES.tar.gz'

const getParams = args => {

  return args.reduce((params, arg, i) => {

    // --foo 100
    const r1 = /^--([a-z]+)$/i

    // --foo="hello world"
    const r2 = /^--([a-z]+)="(.+)"$/i

    // --foo=100
    const r3 = /^--([a-z]+)=(.+)$/i

    const errorMessage = arg => `Argument "${arg}" appears twice. Please, review the command-line arguments.`

    if (r1.test(arg)) {
      const m1 = r1.exec(arg)

      if (params[m1[1]] !== undefined) {
        throw Error(errorMessage(m1[1]))
      }

      params[m1[1]] = true
    }
    else if (r2.test(arg)) {
      const m3 = r2.exec(arg)

      if (params[m3[1]] !== undefined) {
        throw Error(errorMessage(m3[1]))
      }

      params[m3[1]] = m3[2]
    }
    else if (r3.test(arg)) {
      const m2 = r3.exec(arg)

      if (params[m2[1]] !== undefined) {
        throw Error(errorMessage(m2[1]))
      }

      params[m2[1]] = m2[2]
    }
    else {
      const prevParam = Object.keys(params).slice(-1)
      params[prevParam] = arg
    }

    return params

  }, {})

} // getParams

// gathering the parameters
let params
try {
  params = getParams(process.argv.slice(2))
}
catch(err) {
  console.error('ERROR: ' + err.message)
  process.exit(1)
}

// check if the given args are valid
const allowedArgs = [
  'lang',
  'ext',
]

const unknownArgs = Object.keys(params).filter(arg => allowedArgs.indexOf(arg) === -1)
if (unknownArgs.length > 0) {
  console.error(`ERROR: Some of the arguments are unknown: ${unknownArgs.map(a => `"${a}"`).join(', ')}. Please, review the command-line arguments.`)
  process.exit(1)
}

// --lang
// --lang=en_US
// --lang en_US
let language = params['lang']
if (params['lang'] === undefined) {
  language = 'es_ES'
}
else if (params['lang'] === true) {
  console.error(`ERROR: You have to specify a LANGUAGE along with the "--lang" arg. For example, "--lang=en_US" or "--lang en_US"`)
  process.exit(1)
}
else if (!/^[a-z]{2}_[A-Z]{2}$/.test(language)) {
  console.error(`ERROR: Language "${language}" does not have a valid format. The correct format is xx_XX like es_ES, en_US, en_UK`)
  process.exit(1)
}

// --ext
// --ext=zip
// --ext tar.gz (default)
let fileExtension = params['ext']
if (params['ext'] === undefined) {
  fileExtension = 'tar.gz'
}
else if (params['ext'] === true) {
  console.error(`ERROR: You have to specify a FILENAME EXTENSION along with the "--ext" arg. For example, "--ext=zip"`)
  process.exit(1)
}

fileExtension = fileExtension.toLowerCase()

const allowedExtensions = [
  'tar.gz',
  'zip',
]

if (allowedExtensions.indexOf(fileExtension) === -1) {
  console.error(`ERROR: Extension "${fileExtension}" is not valid. Possible values are: "tar.gz" and "zip"`)
  process.exit(1)
}

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
        // show progress every 4 steps (100 / 4 = 25 x #)
        if (percentage % 4 === 0) {
          process.stdout.write('#')
        }

        percentage = currentPercentage
      }
    }).on('end', () => {
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
    process.exit(1)
  }
  else {
    res.setEncoding('utf8')

    let rawData = ''
    res.on('data', chunk => {
      rawData += chunk
    })

    res.on('end', () => {
      try {
        // {
        //   "offers": [
        //     {
        //       "response": "upgrade",
        //       "download": "https://downloads.wordpress.org/release/wordpress-5.4.zip",
        //       "locale": "en_US",
        //       "packages": {
        //         "full": "https://downloads.wordpress.org/release/wordpress-5.4.zip",
        //         "no_content": "https://downloads.wordpress.org/release/wordpress-5.4-no-content.zip",
        //         "new_bundled": "https://downloads.wordpress.org/release/wordpress-5.4-new-bundled.zip",
        //         "partial": false,
        //         "rollback": false
        //       },
        //       "current": "5.4",
        //       "version": "5.4",
        //       "php_version": "5.6.20",
        //       "mysql_version": "5.0",
        //       "new_bundled": "5.3",
        //       "partial_version": false
        //     },
        //     ...
        // }

        const parsedData = JSON.parse(rawData)
        const version = parsedData['offers'][0]['current']

        const fileName = `wordpress-${version}-${language}.${fileExtension}`
        const latestVersionFile = fs.createWriteStream(`./${fileName}`)

        console.log(`Downloading Wordpress v${version} (${language}) ...`)
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
