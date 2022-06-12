import { parentPort, workerData } from 'worker_threads'

import { searchInFileSystem } from './searchInFs'
;(async () => {
  parentPort?.postMessage(searchInFileSystem(workerData))
})()
