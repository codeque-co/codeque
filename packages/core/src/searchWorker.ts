import { parentPort, workerData as _workerData } from 'worker_threads'

import { searchInFileSystem } from './searchInFs'

import { Matches, SearchWorkerData, WorkerOutboundMessage } from './types'

//
;(async () => {
  const workerData = _workerData as SearchWorkerData

  const onPartialResult = workerData.reportEachMatch
    ? (partialResult: Matches) => {
        parentPort?.postMessage({
          type: 'PARTIAL_RESULT',
          data: partialResult,
        } as WorkerOutboundMessage)
      }
    : undefined

  const results = searchInFileSystem({
    ...workerData,
    onPartialResult,
  })

  parentPort?.postMessage({
    type: 'ALL_RESULTS',
    data: results,
  } as WorkerOutboundMessage)
})()
