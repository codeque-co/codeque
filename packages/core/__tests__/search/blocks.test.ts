import { searchInFileSystem } from '/searchInFs'
import { compareCode } from '/astUtils'
import path from 'path'
import { getFilesList } from '/getFilesList'

describe('blocks', () => {
  let filesList = [] as string[]

  beforeAll(async () => {
    filesList = await getFilesList({
      searchRoot: path.resolve(__dirname, '__fixtures__'),
      omitGitIgnore: true,
    })
  })

  it('should match exact whole block', () => {
    const queries = [
      `
      () => {
        toggleRTL();
        I18nManager.forceRTL(!isRTL);
        Updates.reloadAsync();
      }
      `,
    ]

    const { matches } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(matches.length).toBe(1)
    expect(compareCode(matches[0].code, queries[0])).toBeTruthy()
  })

  it('should match block using query without all statements and different order', () => {
    const queries = [
      `
      () => {
        Updates.reloadAsync();
        toggleRTL();
      }
      `,
    ]

    const { matches } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(matches.length).toBe(1)
  })

  it('should match block using query without all statements, but with order', () => {
    const queries = [
      `
      () => {
        toggleRTL();
        Updates.reloadAsync();
      }
      `,
    ]

    const { matches } = searchInFileSystem({
      mode: 'include-with-order',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(matches.length).toBe(1)
  })
})
