import { searchMultiThread as searchMultiThread } from '/searchMultiThread'
import { searchInFileSystem } from '/searchInFs'

import { compareCode } from '/astUtils'
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

  const { matches: resultsMulti, errors: errorsMulti } =
    await searchMultiThread({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: [query],
    })

  expect(resultsMulti.length).toBe(204)
  expect(errorsMulti).toHaveLength(0)
  expect(errorsSingle).toHaveLength(0)

  expect(resultsMulti.length).toBe(resultsSingle.length)

  const codeSingle = resultsSingle.map(({ code }) => code)
  const codeMulti = resultsMulti.map(({ code }) => code)
  const compareResults = codeSingle
    .map((code, idx) => compareCode(code, codeMulti[idx]))
    .reduce((acc, result) => result && acc, true)

  expect(compareResults).toBeTruthy()
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
