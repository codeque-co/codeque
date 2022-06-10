import { parentPort, workerData } from 'worker_threads'

import { searchInFileSystem } from './searchInFs'

import { textSearch } from './textSearch'
;(async () => {
  if (workerData.mode === 'text') {
    parentPort?.postMessage(textSearch(workerData))
  } else {
    parentPort?.postMessage(searchInFileSystem(workerData))
  }
})()
