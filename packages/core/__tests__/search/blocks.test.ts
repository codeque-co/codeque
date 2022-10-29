import { searchInFileSystem } from '/searchInFs'
import { compareCode } from '/astUtils'
import path from 'path'
import { getFilesList } from '/getFilesList'
import { searchInStrings } from '../../src/searchInStrings'

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

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(matches.length).toBe(1)
    expect(errors.length).toBe(0)
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

    expect(matches.length).toBe(1)
    expect(errors.length).toBe(0)
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

    expect(matches.length).toBe(1)
    expect(errors.length).toBe(0)
  })

  it('should match contents inside catch block', () => {
    const fileContent = `
        try {
          someFn()
        }
        catch (e) {
          const a = 'b'
          const b = 'a'
          throw Error('some')
        }

        function some() {
          throw Error('some')

          const a = 'b'
        }
      `

    const queries = [
      `
      {
        const a = 'b'
        throw Error('some')
      }
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      caseInsensitive: true,
      queryCodes: queries,
      files: [
        {
          path: 'mock',
          content: fileContent,
        },
      ],
    })

    expect(matches.length).toBe(2)
    expect(errors.length).toBe(0)
  })
})
