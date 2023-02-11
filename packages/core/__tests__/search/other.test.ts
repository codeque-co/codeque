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

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(190)
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

  it('Should match try-catch block with statement and re-throw of error', () => {
    const fileContent = `
    try {
      await bla.bla.bla
    } catch (error) {
      logger.error(error);
      throw error;
    }
    `

    const queries = [`try {} catch($$) { Logger.error($$); throw $$ }`]

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

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('Should match class with static method', () => {
    const fileContent = `
      class Test {
        method() { return 0 }
        static getInstance(){
          return new Test()
        }
      }
    `

    const queries = [`class $$ {static getInstance(){}}`]

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

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })
})
