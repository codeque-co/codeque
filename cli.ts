import path from 'path'
import fs from 'fs'
import { search, Mode } from './src/search'
import { getFilesList } from './src/getFilesList'
import { green, white, bold } from "colorette"

const root = path.resolve('../../Dweet/web')
const query = fs.readFileSync(path.resolve('./cliQuery')).toString()

const mode = process.argv[2] as Mode || 'include'

const modes: Mode[] = ['include', 'exact', 'include-with-order']

if (!modes.includes(mode)) {
  console.error('Invalid mode: ', mode, '\nValid modes: ', ...modes)
}

console.log('\nMode: ', mode, '\n')

console.log('Query:\n\n' + query + '\n')

const results = search({
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

