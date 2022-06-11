import { getFilesList } from '/getFilesList'
import path from 'path'
import { searchInFileSystem } from '/searchInFs'

describe('Text search mode', () => {
  let filesList = [] as string[]

  beforeAll(async () => {
    filesList = await getFilesList(path.resolve(__dirname, '__fixtures__'))
  })
  it('should perform basic text search', () => {
    const results = searchInFileSystem({
      queryCodes: [`const $$ = use$$(`],
      filePaths: filesList,
      mode: 'text'
    })

    expect(results.matches.length).toBe(7)
    expect(results.matches[0].code).toBe('const { colors } = useTheme(')
  })

  /**
   * Add one test per wildcard type
   *
   * Once-two tests for matching space agnostic
   */
})
