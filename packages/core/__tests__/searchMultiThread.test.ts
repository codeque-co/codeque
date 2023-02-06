import { searchMultiThread as searchMultiThread } from '/searchMultiThread'
import { searchInFileSystem } from '/searchInFs'

import { compareCode } from './utils'
import path from 'path'
import { getFilesList } from '/getFilesList'

jest.mock('worker_threads', () => {
  const actual = jest.requireActual('worker_threads')

  function Worker(_: string, params: any) {
    const mockedPath = path.resolve(process.cwd(), 'dist/searchWorker.js')

    return new actual.Worker(mockedPath, params)
  }

  return {
    ...actual,
    Worker,
  }
})

it('should search using multiple threads and give the same matches count as single thread search', async () => {
  const filesList = await getFilesList({
    searchRoot: path.resolve(__dirname, 'search', '__fixtures__'),
    omitGitIgnore: true,
  })
  const query = `
    () => $$$
  `

  const { matches: resultsSingle, errors: errorsSingle } = searchInFileSystem({
    mode: 'exact',
    filePaths: filesList,
    queryCodes: [query],
  })

  const { matches: resultsMulti1, errors: errorsMulti1 } =
    await searchMultiThread({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: [query],
      singleThreadFilesCountLimitStructural: Math.round(filesList.length / 4),
    })

  const { matches: resultsMulti2, errors: errorsMulti2 } =
    await searchMultiThread({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: [query],
      singleThreadFilesCountLimitStructural: Math.round(40),
    })

  expect(errorsMulti1).toHaveLength(0)
  expect(resultsMulti1.length).toBe(204)

  expect(errorsMulti2).toHaveLength(0)
  expect(resultsMulti2.length).toBe(204)

  expect(errorsSingle).toHaveLength(0)

  expect(resultsMulti1.length).toBe(resultsSingle.length)
  expect(resultsMulti2.length).toBe(resultsSingle.length)

  const codeSingle = resultsSingle.map(({ code }) => code)
  const codeMulti1 = resultsMulti1.map(({ code }) => code)
  const codeMulti2 = resultsMulti2.map(({ code }) => code)

  const compareResults1 = codeSingle
    .map((code, idx) => compareCode(code, codeMulti1[idx]))
    .reduce((acc, result) => result && acc, true)

  const compareResults2 = codeSingle
    .map((code, idx) => compareCode(code, codeMulti2[idx]))
    .reduce((acc, result) => result && acc, true)

  expect(compareResults1).toBeTruthy()
  expect(compareResults2).toBeTruthy()
})

it('Should report each match separately for structural search', async () => {
  const filesList = await getFilesList({
    searchRoot: path.resolve(__dirname, 'search', '__fixtures__'),
    omitGitIgnore: true,
  })

  const query = `
    () => $$$
  `

  const onPartialResultMock = jest.fn()

  const { matches } = await searchMultiThread({
    mode: 'exact',
    filePaths: filesList,
    queryCodes: [query],
    onPartialResult: onPartialResultMock,
  })

  const countOfResultsFromPartialReport = onPartialResultMock.mock.calls.reduce(
    (count, [partialResults]) => count + partialResults.length,
    0,
  )

  expect(countOfResultsFromPartialReport).toBe(matches.length)
})

it('Should report each match separately for text search', async () => {
  const filesList = await getFilesList({
    searchRoot: path.resolve(__dirname, 'search', '__fixtures__'),
    omitGitIgnore: true,
  })

  const query = `
    () => $$$
  `

  const onPartialResultMock = jest.fn()

  const { matches } = await searchMultiThread({
    mode: 'text',
    filePaths: filesList,
    queryCodes: [query],
    onPartialResult: onPartialResultMock,
  })

  const countOfResultsFromPartialReport = onPartialResultMock.mock.calls.reduce(
    (count, [partialResults]) => count + partialResults.length,
    0,
  )

  expect(countOfResultsFromPartialReport).toBe(matches.length)
})
