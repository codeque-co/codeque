import path from 'path'
import fs from 'fs'
import { search } from './search'
import { Mode, getMode, logMetrics, print } from './utils'
import { init } from './wasm'

const query = fs.readFileSync(path.resolve('./devQuery')).toString()

const mockFilePath = path.resolve('./devFile')

;(async () => {
  await init()
  const { matches, errors } = search({
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
