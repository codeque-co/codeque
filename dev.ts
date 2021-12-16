import path from 'path';
import fs from 'fs';
import { search } from './src/search';
import { Mode, getMode, logMetrics, print } from './src/utils'


const query = fs.readFileSync(path.resolve('./devQuery')).toString()

const mockFilePath = path.resolve('./devFile')

const matches = search({
  queryCodes: [query],
  filePaths: [mockFilePath],
  mode: getMode(process.argv[2] as Mode),
  caseInsensitive: Boolean(process.argv[3]),
  debug: true,
})

print(matches)
logMetrics()