const fs = require('fs')

const { __internal } = require('../../dist/index')

const print = console.log

const defaultParser = 'python'
const userParser = process.argv[2]

if (userParser === undefined) {
  print('Using default parser:', defaultParser)
} else {
  print('Using parser:', userParser)
}

const parserName = userParser ?? defaultParser

const parserSettings = __internal.parserSettingsMap[parserName]()

const runtime = async () => {
  await parserSettings?.parserInitPromise
  print('Parser loaded')

  const filePathWithSourceCode = `${__dirname}/code.txt`
  const jsonOutputFilePath = `${__dirname}/${parserName}.json`

  const parseFile = () => {
    const content = fs.readFileSync(filePathWithSourceCode).toString()

    try {
      const ast = parserSettings.parseCode(content)

      fs.writeFileSync(jsonOutputFilePath, JSON.stringify(ast, null, 2))
      print('Parsed correctly')
    } catch (e) {
      console.error('Parse error', e)
    }
  }

  fs.watchFile(filePathWithSourceCode, { interval: 500 }, parseFile)

  parseFile()
}

runtime()
