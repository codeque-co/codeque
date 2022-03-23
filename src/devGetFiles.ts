import { logMetrics } from './utils'
import { getFilesList } from './getFilesList'

const root = process.argv[2] || process.cwd()

;(async () => {
  const filesList = await getFilesList(root)
  console.log(filesList.slice(0, 50))
  console.log('filesListLen', filesList.length)
  logMetrics()
})()
