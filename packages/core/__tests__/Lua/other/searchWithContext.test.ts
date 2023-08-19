import { searchInStrings } from '../../../src/searchInStrings'
import { compareCode, getParserSettings } from '../../utils'

describe('Search with context', () => {
  beforeAll(async () => {
    await getParserSettings().init?.()
  })

  it('Should partial match function definition using wildcard and alias', () => {
    const fileContent = `
      function fact (n)
        if n == 0 then
          print()
          return 1
        else
          print()
          return n * fact(n-1)
        end
      end

    `
    const queries = [
      `
        function fact (n)
          if n == 0 then
            $$_refPrint()
            return 1
          else
            $$_refPrint()
            return n * fact(n-1)
          end
        end
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

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)

    const match = matches[0]

    expect(match.aliases.identifierAliasesMap['refPrint'].aliasValue).toBe(
      'print',
    )

    expect(compareCode(fileContent, match.code)).toBe(true)

    expect(match.loc).toStrictEqual({
      start: { line: 2, column: 6, index: 7 },
      end: { line: 10, column: 9, index: 168 },
    })
  })
})
