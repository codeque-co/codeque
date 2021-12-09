import path from 'path';
import fs from 'fs';
import { search } from './src/search';
import { Mode, getMode } from './src/utils'


const query = fs.readFileSync(path.resolve('./devQuery')).toString()

const mockFilePath = path.resolve('./devFile')

const matches = search({
  queries: [query],
  filePaths: [mockFilePath],
  mode: getMode(process.argv[2] as Mode),
  debug: true,
})

console.log(matches)