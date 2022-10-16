import { cpus } from 'os'
import { Worker } from 'worker_threads'
import {
  FileSystemSearchArgs,
  SearchResults,
  WorkerOutboundMessage,
  SearchWorkerData,
  HardStopFlag,
} from './types'

const coresCount = Math.round(cpus().length / 2)

export const searchMultiThread = async ({
  filePaths,
  onPartialResult,
  hardStopFlag,
  maxResultsLimit,
  ...params
}: FileSystemSearchArgs & { hardStopFlag?: HardStopFlag }) => {
  const tasks = []
  const chunksCount = params.mode === 'text' ? 1 : coresCount
  const chunkSize = Math.round(filePaths.length / chunksCount)
  const maxResultsPerChunk = maxResultsLimit
    ? Math.round(maxResultsLimit / chunksCount)
    : undefined

  for (let i = 0; i < chunksCount; i++) {
    const startIndex = i * chunkSize
    const endIndex = i < chunksCount - 1 ? startIndex + chunkSize : undefined
    const filePathsSlice = filePaths.slice(startIndex, endIndex)
    const task = new Promise<SearchResults>((resolve, reject) => {
      const worker = new Worker(__dirname + '/searchWorker.js', {
        workerData: {
          ...params,
          filePaths: filePathsSlice,
          reportEachMatch: onPartialResult !== undefined,
          maxResultsLimit: maxResultsPerChunk,
        } as SearchWorkerData,
      })
      worker.postMessage({ type: 'TEST_MSG' })

      if (hardStopFlag) {
        hardStopFlag.addStopListener(async () => {
          await worker.terminate()

          resolve({ errors: [], matches: [], hints: [] })
        })
      }

      worker.on('message', (message: WorkerOutboundMessage) => {
        if (message.type === 'PARTIAL_RESULT') {
          onPartialResult?.(message.data)
        } else {
          resolve(message.data)
        }
      })

      worker.on('error', reject)

      worker.on('exit', (code) => {
        if (code !== 0 && !hardStopFlag?.stopSearch) {
          reject(new Error(`Worker stopped with exit code ${code}`))
        }
      })
    })

    tasks.push(task)
  }

  const result = await Promise.all(tasks)

  return result.reduce(
    (allResults, partialResult) => {
      return {
        matches: [...allResults.matches, ...partialResult.matches],
        errors: [...allResults.errors, ...partialResult.errors],
        hints: partialResult.hints, // hints should be the same for each partial result
      }
    },
    {
      matches: [],
      errors: [],
      hints: [],
    },
  )
}
