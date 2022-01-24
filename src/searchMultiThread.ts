import {
  Worker
} from 'worker_threads'
import { cpus } from 'os';
import path from 'path';
import type { SearchArgs, Matches, SearchResults } from './search';

const coresCount = Math.round(cpus().length / 2)

export const search = async ({ filePaths, ...params }: SearchArgs) => {
  const tasks = []
  const chunkSize = Math.round(filePaths.length / coresCount)

  for (let i = 0; i < coresCount; i++) {
    const startIndex = i * chunkSize
    const endIndex = i < coresCount - 1 ? startIndex + chunkSize : undefined
    const filePathsSlice = filePaths.slice(startIndex, endIndex)
    const task = new Promise<SearchResults>((resolve, reject) => {
      const worker = new Worker(__dirname + '/worker.js', {
        workerData: {
          ...params,
          filePaths: filePathsSlice
        }
      });
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });

    tasks.push(task)
  }

  const result = await Promise.all(tasks)

  return result.reduce((allResults, partialResult) => {
    return {
      matches: [...allResults.matches, ...partialResult.matches],
      errors: [...allResults.errors, ...partialResult.errors],
    }
  }, {
    matches:[],errors:[]
  })
};
