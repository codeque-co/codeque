import {
  Worker, isMainThread, parentPort, workerData
} from 'worker_threads'

import { search } from './search';

parentPort?.postMessage(search(workerData));