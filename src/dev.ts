import path from 'path'
import fs from 'fs'
import { searchInFileSystem } from './searchInFs'
import { Mode, getMode, logMetrics, print } from './utils'

const query = fs.readFileSync(path.resolve('./devQuery')).toString()

const mockFilePath = path.resolve('./devFile')

;(async () => {
  const { matches, errors } = searchInFileSystem({
    queryCodes: [query],
    filePaths: [mockFilePath],
    mode: getMode(process.argv[2] as Mode),
    caseInsensitive: Boolean(process.argv[3]),
    debug: true
  })

  print('matches', matches)
  print('errors', errors)
  logMetrics()
})()
