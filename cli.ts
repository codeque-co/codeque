import path from 'path'
import fs from 'fs'
// import { search } from '/search'
import { search } from '/searchMultiThread'

import { getFilesList } from '/getFilesList'
import { green, white, bold } from "colorette"
import { Mode, getMode, logMetrics } from '/utils'

(async () => {

  const root = path.resolve('../../Dweet/web')
  const query = fs.readFileSync(path.resolve('./cliQuery')).toString()

  const mode = getMode(process.argv[2] as Mode)

  console.log('\nMode: ', mode, '\n')

  console.log('Query:\n\n' + query + '\n')

  const results = await search({
    mode,
    filePaths: getFilesList(root),
    queries: [query]
  })

  if (results.length > 0) {
    const first20 = results.slice(0, 20)

    first20.forEach((result) => {
      console.log(green(result.filePath), ':')
      console.log('')
      console.log(white(bold(result.code.split('\n').map((line) => ` ${line}`).join('\n'))), '\n')
    })

    console.log('Total count:', results.length)
  }
  else {
    console.log('No results found :c\n')
  }

  logMetrics()
})()
