import { cpus } from 'os'
import { Worker } from 'worker_threads'
import {
  FileSystemSearchArgs,
  SearchResults,
  WorkerOutboundMessage,
  SearchWorkerData,
  HardStopFlag,
} from './types'
import { measureStart, logMetrics } from './utils'
import { searchInFileSystem } from './searchInFs'
import { parserSettingsMap } from './parserSettings'

const coresCount = Math.round(cpus().length / 2)
const singleThreadFilesCountLimitStructuralDefault = 350
const singleThreadFilesCountLimitTextDefault = 1500

export const searchMultiThread = async ({
  filePaths,
  onPartialResult,
  hardStopFlag,
  maxResultsLimit,
  singleThreadFilesCountLimitStructural = singleThreadFilesCountLimitStructuralDefault,
  singleThreadFilesCountLimitText = singleThreadFilesCountLimitTextDefault,
  debug,
  ...params
}: FileSystemSearchArgs & {
  hardStopFlag?: HardStopFlag
  singleThreadFilesCountLimitStructural?: number
  singleThreadFilesCountLimitText?: number
}) => {
  const filePathsCount = filePaths.length
  const isTextSearch = params.mode === 'text'
  const singleThreadFilesCountLimit = isTextSearch
    ? singleThreadFilesCountLimitText
    : singleThreadFilesCountLimitStructural
  /**
   * Turned out that spawning a worker adds +300/400 ms overhead, so it's not always worth spawning it
   */
  const notWorthSpawningWorkers = filePathsCount < singleThreadFilesCountLimit
  const tasks = []
  const chunksCount = notWorthSpawningWorkers
    ? 1
    : /** It's not worth to split eg. 400 files into 4 chunks, so we calculate that based on singleThreadFilesCountLimit */
      Math.min(
        coresCount,
        Math.round(filePathsCount / singleThreadFilesCountLimit),
      )
  const chunkSize = Math.round(filePathsCount / chunksCount)
  /**
   * It's better to keep first chunk bigger if possible till the singleThreadFilesCountLimit
   */
  const firstChunkSize =
    chunkSize < singleThreadFilesCountLimit
      ? singleThreadFilesCountLimit
      : chunkSize

  const maxResultsPerChunk = maxResultsLimit
    ? Math.round(maxResultsLimit / chunksCount)
    : undefined

  for (let i = 0; i < chunksCount; i++) {
    const actualCurrentChunkSize = i === 0 ? firstChunkSize : chunkSize
    const actualFirstPrevChunkSize = i >= 1 ? firstChunkSize : 0
    const actualSubsequentPrevChunkSize = i >= 2 ? chunkSize : 0
    const subsequentPrevChunksCount = Math.max(i - 1, 0)

    const startIndex =
      actualFirstPrevChunkSize +
      subsequentPrevChunksCount * actualSubsequentPrevChunkSize
    const endIndex =
      i < chunksCount - 1 ? startIndex + actualCurrentChunkSize : undefined

    const filePathsSlice = filePaths.slice(startIndex, endIndex)

    const searchParams = {
      ...params,
      filePaths: filePathsSlice,
      reportEachMatch: onPartialResult !== undefined,
      maxResultsLimit: maxResultsPerChunk,
    } as SearchWorkerData
    const task = new Promise<SearchResults>((resolve, reject) => {
      if (i === 0) {
        /**
         * Timeout to not block starting other searches
         */
        setTimeout(async () => {
          try {
            if (params.parser) {
              await parserSettingsMap[params.parser]().init?.(
                params.parserFilesBasePath,
              )
            }

            const results = searchInFileSystem({
              ...searchParams,
              onPartialResult,
              hardStopFlag,
            })
            resolve(results)
          } catch (e) {
            const error = new Error(
              'Search on main thread failed with error ' + (e as Error).message,
            )
            error.stack = (e as Error)?.stack

            reject(error)
          }
        }, 0)
      } else {
        const measureWorkerReturnResult = measureStart('WorkerReturnResult')
        const worker = new Worker(__dirname + '/searchWorker.js', {
          workerData: searchParams,
        })

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
            measureWorkerReturnResult()
            resolve(message.data)
          }
        })

        worker.on('error', reject)

        worker.on('exit', (code) => {
          if (code !== 0 && !hardStopFlag?.stopSearch) {
            reject(new Error(`Worker stopped with exit code ${code}`))
          }
        })
      }
    })

    tasks.push(task)
  }

  const measureWorkerProcessingTime = measureStart('WorkerProcessingTime')

  const result = await Promise.all(tasks)

  measureWorkerProcessingTime()

  const mergedResults = result.reduce(
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

  if (debug) {
    logMetrics()
  }

  return mergedResults
}
