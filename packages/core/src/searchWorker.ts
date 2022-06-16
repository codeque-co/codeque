import { parentPort, workerData } from 'worker_threads'

import { searchInFileSystem } from './searchInFs'

//eslint-disable-next-line
;(async () => {
  parentPort?.postMessage(searchInFileSystem(workerData))
})()
