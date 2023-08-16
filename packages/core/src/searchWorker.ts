import { parentPort, workerData as _workerData } from 'worker_threads'
import { parserSettingsMap } from './parserSettings'

import { searchInFileSystem } from './searchInFs'

import { Matches, SearchWorkerData, WorkerOutboundMessage } from './types'

const searchWorkerRuntime = async () => {
  const workerData = _workerData as SearchWorkerData
  const parser = workerData.parser
  const parserFilesBasePath = workerData.parserFilesBasePath

  if (parser) {
    await parserSettingsMap[parser]().init?.(parserFilesBasePath)
  }

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
}

searchWorkerRuntime()
