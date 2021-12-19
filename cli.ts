import path from 'path'
import fs from 'fs'
import { search } from '/searchMultiThread'
import { getFilesList } from '/getFilesList'
import { green, magenta, cyan, bold, red, yellow } from "colorette"
import { Mode, getMode, getCodeFrame, print } from '/utils'
import { parseQueries } from '/parseQuery'
import { openAsyncEditor } from './terminalEditor'

(async () => {
  const resultsLimitCount = 20
  const root = path.resolve('../../Dweet/web')
  let prevQuery = ''

  try {
    prevQuery = fs.readFileSync(path.resolve('./cliQuery')).toString()
  }
  catch (e) { }

  const mode = getMode(process.argv[2] as Mode)
  const caseInsensitive = Boolean(process.argv[3])

  const separator = '\n'.padStart(process.stdout.columns, '━')
  const modeAndCaseText = `${separator}${cyan(bold('Mode:'))} ${green(mode)}   ${cyan(bold('Case:'))} ${green(caseInsensitive ? 'insensitive' : 'sensitive')}\n`

  const query = await openAsyncEditor({ header: `${modeAndCaseText}\n✨ Type query:`, code: prevQuery })
  fs.writeFileSync(path.resolve('./cliQuery'), query)


  const startTime = Date.now()

  print(modeAndCaseText)

  const [[{ error }], parseOk] = parseQueries([query])

  if (parseOk) {
    print(cyan(bold('Query:\n\n')) + getCodeFrame(query, 1, true) + '\n')
  }
  else {
    if (query.length > 0) {
      print(red(bold('Query parse error:\n\n')) + getCodeFrame(query, 1, false, error?.location) + '\n')
    }
    print(red(bold('Error:')), error?.text, '\n')

    process.exit(1)
  }

  const results = await search({
    mode,
    filePaths: getFilesList(root),
    caseInsensitive,
    queryCodes: [query]
  })
  const endTime = Date.now()
  if (results.length > 0) {
    const first20 = results.slice(0, resultsLimitCount)
    const resultsText = results.length <= resultsLimitCount ? `Results:\n` : `First ${resultsLimitCount} results:\n`

    print(cyan(bold(resultsText)))

    first20.forEach((result) => {
      const startLine = result.loc.start.line
      const codeFrame = getCodeFrame(result.code, startLine)
      print(`${green(result.filePath)}:${magenta(startLine)}:${yellow(result.loc.start.column + 1)}`)
      print('\n' + codeFrame + '\n')
    })

    print(cyan(bold('Total count:')), magenta(results.length))
  }
  else {
    print(cyan(bold('No results found :c\n')))
  }
  print(cyan(bold('Found in:')), magenta((endTime - startTime) / 1000), 's', '\n')
})()
