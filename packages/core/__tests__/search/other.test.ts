import { searchInFileSystem } from '/searchInFs'
import path from 'path'
import { getFilesList } from '/getFilesList'
import { searchInStrings } from '../../src/searchInStrings'

describe('Other', () => {
  let filesList = [] as string[]

  beforeAll(async () => {
    filesList = await getFilesList({
      searchRoot: path.resolve(__dirname, '__fixtures__'),
      omitGitIgnore: true,
    })
  })

  it('should not include the same result twice', () => {
    const queries = [
      `
      type $$ = ScrollViewProps & $$$
      `,
      `
       type $$ = $$$ & ScrollViewProps
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should not include the same result twice 2', () => {
    const queries = [
      `
      <$$$
        $$={() => {}}
      />
    `,
      `
      <$$$
        $$={() => $$$}
      />
    `,
      `
      <$$$
        $$={() => {}}
      >
      </$$$>
    `,
      `
      <$$$
        $$={() => $$$}
      >
      </$$$>
    `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(matches.length).toBe(190)
    expect(errors).toHaveLength(0)
  })

  it('should match anything', () => {
    const queries = [
      `
      $$$
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(17149)
  })

  it('Should properly match identifiers with multiple wildcard sections', () => {
    const fileContent = `
      varOne;
      var_two;
    `

    const queries = [`$$_$$`]

    const { matches, errors } = searchInStrings({
      mode: 'exact',
      caseInsensitive: true,
      queryCodes: queries,
      files: [
        {
          path: 'mock',
          content: fileContent,
        },
      ],
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })
})
