import { parentPort, workerData } from 'worker_threads'
import { init } from './wasm'

import { search } from './search'
import { textSearch } from './textSearch'
;(async () => {
  await init()
  if (workerData.mode === 'text') {
    parentPort?.postMessage(textSearch(workerData))
  } else {
    parentPort?.postMessage(search(workerData))
  }
})()
