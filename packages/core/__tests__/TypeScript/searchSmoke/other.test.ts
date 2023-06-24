import { fixturesPath } from '../../utils'
import { useTraverseApproachTestOnly } from '../../../src/testOnlyConfig'
import { getFilesList } from '../../../src/getFilesList'
import { searchInFileSystem } from '../../../src/searchInFs'

describe('Other', () => {
  let filesList = [] as string[]

  beforeAll(async () => {
    filesList = await getFilesList({
      searchRoot: fixturesPath,
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

    expect(errors).toHaveLength(0)
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

    const countForTraversalMode = 6381 // will just match identifier-like nodes
    const countForNonTraversalMode = 17149 // will match any node

    const expectedCount = useTraverseApproachTestOnly
      ? countForTraversalMode
      : countForNonTraversalMode

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(expectedCount)
  })
})
