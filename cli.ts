import path from 'path'
import fs from 'fs'
import { search } from '/searchMultiThread'
import { getFilesList } from '/getFilesList'
import { green, magenta, cyan, bold, red, yellow } from "colorette"
import { Mode, getMode, getCodeFrame, print } from '/utils'
import { parseQueries } from '/parseQuery'

(async () => {
  const resultsLimitCount = 20
  const root = path.resolve('../../Dweet/web')
  const query = fs.readFileSync(path.resolve('./cliQuery')).toString()

  const mode = getMode(process.argv[2] as Mode)

  print(cyan(bold('\nMode: ')), green(mode), '\n')

  const [[{ error }], parseOk] = parseQueries([query])

  if (parseOk) {
    print(cyan(bold('Query:\n\n')) + getCodeFrame(query, 1, true) + '\n')
  }
  else {
    print(red(bold('Query parse error:\n\n')) + getCodeFrame(query, 1, false, error?.location) + '\n')
    print(red(bold('Error:')), error?.text, '\n')

    process.exit(1)
  }

  const results = await search({
    mode,
    filePaths: getFilesList(root),
    queryCodes: [query]
  })

  if (results.length > 0) {
    const first20 = results.slice(0, resultsLimitCount)
    const resultsText = results.length <= resultsLimitCount ? `Results:\n` : `First ${resultsLimitCount} results:\n`

    print(cyan(bold(resultsText)))

    first20.forEach((result) => {
      const startLine = result.start.line
      const codeFrame = getCodeFrame(result.code, startLine)
      print(`${green(result.filePath)}:${magenta(startLine)}:${yellow(result.start.column)}`)
      print('\n' + codeFrame + '\n')
    })

    print(cyan(bold('Total count:')), magenta(results.length))
  }
  else {
    print(cyan(bold('No results found :c\n')))
  }

})()
