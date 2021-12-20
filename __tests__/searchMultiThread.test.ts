import { search as searchMultiThread } from '/searchMultiThread'
import { search } from '/search'

import { compareCode } from '/astUtils';
import path from 'path'
import { getFilesList } from '/getFilesList'

jest.mock('worker_threads', () => {
  const actual = jest.requireActual('worker_threads')
  function Worker(_: string, params: any) {
    const mockedPath = path.resolve(process.cwd(), 'dist/worker.js')
    return new actual.Worker(mockedPath, params)
  }
  return {
    ...actual,
    Worker
  }
})

const filesList = getFilesList(path.resolve(__dirname, 'search', '__fixtures__'))

it('should search using multiple threads and give the same results count as single thread search', async () => {
  const query = `
    () => $$
  `

  const resultsSingle = search({
    mode: 'exact',
    filePaths: filesList,
    queryCodes: [query]
  })

  const resultsMulti = await searchMultiThread({
    mode: 'exact',
    filePaths: filesList,
    queryCodes: [query]
  })

  expect(resultsMulti.length).toBe(204)

  expect(resultsMulti.length).toBe(resultsSingle.length)

  const codeSingle = resultsSingle.map(({ code }) => code)
  const codeMulti = resultsMulti.map(({ code }) => code)
  const compareResults = codeSingle.map((code, idx) => compareCode(code, codeMulti[idx])).reduce((acc, result) => result && acc, true)

  expect(compareResults).toBeTruthy()
})