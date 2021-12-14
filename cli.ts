import path from 'path'
import fs from 'fs'
import { search } from '/searchMultiThread'
// import { search } from '/search'
import { getFilesList } from '/getFilesList'
import { green, magenta, cyan, bold } from "colorette"
import { Mode, getMode, getCodeFrame } from '/utils'

(async () => {

  const root = path.resolve('../../Dweet/web')
  const query = fs.readFileSync(path.resolve('./cliQuery')).toString()

  const mode = getMode(process.argv[2] as Mode)

  console.log(cyan(bold('\nMode: ')), green(mode), '\n')

  console.log(cyan(bold('Query:\n\n')) + getCodeFrame(query, 1, true) + '\n')

  const results = await search({
    mode,
    filePaths: getFilesList(root),
    queries: [query]
  })

  if (results.length > 0) {
    const first20 = results.slice(0, 20)

    console.log(cyan(bold('Results:\n')))

    first20.forEach((result) => {
      const startLine = result.start.line
      const codeFrame = getCodeFrame(result.code, startLine)
      console.log(`${green(result.filePath)}:${magenta(startLine)}`)
      console.log('\n' + codeFrame + '\n')
    })

    console.log(cyan(bold('Total count:')), magenta(results.length))
  }
  else {
    console.log(cyan(bold('No results found :c\n')))
  }

})()
