import { cpus } from 'os'
import { Worker } from 'worker_threads'
import type { FileSystemSearchArgs, SearchResults } from './types'

const coresCount = Math.round(cpus().length / 2)

export const searchMultiThread = async ({
  filePaths,
  ...params
}: FileSystemSearchArgs) => {
  const tasks = []
  const chunksCount = params.mode === 'text' ? 1 : coresCount
  const chunkSize = Math.round(filePaths.length / chunksCount)

  for (let i = 0; i < chunksCount; i++) {
    const startIndex = i * chunkSize
    const endIndex = i < chunksCount - 1 ? startIndex + chunkSize : undefined
    const filePathsSlice = filePaths.slice(startIndex, endIndex)
    const task = new Promise<SearchResults>((resolve, reject) => {
      const worker = new Worker(__dirname + '/searchWorker.js', {
        workerData: {
          ...params,
          filePaths: filePathsSlice
        }
      })
      worker.on('message', resolve)
      worker.on('error', reject)

      worker.on('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`))
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
        hints: partialResult.hints // hints should be the same for each partial result
      }
    },
    {
      matches: [],
      errors: [],
      hints: []
    }
  )
}
