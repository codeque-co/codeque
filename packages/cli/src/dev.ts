import { getMode, Mode, searchInFileSystem } from '@codeque/core'
import fs from 'fs'
import path from 'path'

const query = fs.readFileSync(path.resolve('./devQuery')).toString()

const mockFilePath = path.resolve('./devFile')

;(async () => {
  const { matches, errors } = searchInFileSystem({
    queryCodes: [query],
    filePaths: [mockFilePath],
    mode: getMode(process.argv[2] as Mode),
    caseInsensitive: Boolean(process.argv[3]),
    debug: true,
  })

  console.log('matches', matches)
  console.log('errors', errors)
})()
