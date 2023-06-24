import { useTraverseApproachTestOnly } from '../../../src/testOnlyConfig'
import { searchInFileSystem } from '../../../src/searchInFs'

import { searchInStrings } from '../../../src/searchInStrings'

describe('other', () => {
  it('should match cast to any', () => {
    const fileContent = `
      const val = 5 as any
      const val2 = (fn() as any) as MyType
    `

    const queries = [
      `
      ($$$ as any)
    `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'exact',
      files: [{ content: fileContent, path: '' }],

      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(2)
  })

  it('should match anything', () => {
    const fileContent = `
      const a:Object = {
        val : 5
      }
    `

    const queries = [
      `
      $$$
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      queryCodes: queries,
    })

    // In traversal we only project query to identifier nodes
    const expectedMatchesCount = global.testSettings?.isTraversal ? 3 : 10

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(expectedMatchesCount)
  })

  it('should not include the same result twice', () => {
    const fileContent = `type MyType = ScrollViewProps & BoxProps`

    const queries = [
      `
      type $$ = ScrollViewProps & $$$
      `,
      `
       type $$ = $$$ & ScrollViewProps
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [{ content: fileContent, path: '' }],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })
})
