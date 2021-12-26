import {
  Worker, isMainThread, parentPort, workerData
} from 'worker_threads'
import { init } from './wasm'

import { search } from './search';

(async () => {
  await init()
  parentPort?.postMessage(search(workerData));
})()