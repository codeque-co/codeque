import {
  getMode,
  Mode,
  searchInFileSystem,
  searchMultiThread,
} from '@codeque/core'
import fs from 'fs'
import path from 'path'

const query = fs.readFileSync(path.resolve('./devQuery')).toString()

const mockFilePath = path.resolve('./devFile')
const mockFilesCount = 350
const filePaths = Array(mockFilesCount).fill(mockFilePath)

;(async () => {
  const start = Date.now()
  const { matches, errors } = await searchMultiThread({
    queryCodes: [query],
    filePaths,
    mode: getMode(process.argv[2] as Mode),
    caseInsensitive: Boolean(process.argv[3]),
    debug: true,
  })

  console.log('time', Date.now() - start)

  console.log('matches', matches.length)
  console.log('errors', errors)
})()
