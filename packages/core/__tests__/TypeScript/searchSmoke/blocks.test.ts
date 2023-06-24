import { searchInFileSystem } from '../../../src/searchInFs'
import { compareCode } from '../../utils'

import { fixturesPath } from '../../utils'
import { getFilesList } from '../../../src/getFilesList'

describe('blocks', () => {
  let filesList = [] as string[]

  beforeAll(async () => {
    filesList = await getFilesList({
      searchRoot: fixturesPath,
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

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
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

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
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

    const { matches, errors } = searchInFileSystem({
      mode: 'include-with-order',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })
})
