import { searchInStrings } from '../../../src/searchInStrings'
import { getParserSettings, compareCode } from '../../utils'

describe('Binary Expression', () => {
  beforeAll(async () => {
    await getParserSettings().init?.()
  })

  it('Should binary expression based on operator (which is not defined by tree-sitter)', async () => {
    const fileContent = `
      local var = a ^    b
      local var = a   * b
      local var = a and     b
    `
    const queries = [
      `
      local var = a*b
    `,
    ]

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

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
    expect(matches[0].code).toBe('local var = a   * b')
  })
})
