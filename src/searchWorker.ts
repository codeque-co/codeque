import {
  Worker, isMainThread, parentPort, workerData
} from 'worker_threads'
import { init } from './wasm'

import { search } from './search';

(async () => {
  const start = Date.now()
  await init()
  console.log('init time', Date.now() - start)
  parentPort?.postMessage(search(workerData));
})()