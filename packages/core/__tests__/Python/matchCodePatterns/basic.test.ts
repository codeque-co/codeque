import { searchInStrings } from '../../../src/searchInStrings'
import { getParserSettings, compareCode } from '../../utils'

describe('Basic queries', () => {
  beforeAll(async () => {
    await getParserSettings().parserInitPromise
  })

  it('Should exact match identifier', async () => {
    const fileContent = `
      print;
    `
    const queries = [fileContent]

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
  })

  it('Should exact match function definition', () => {
    const fileContent = `
      def fib(n):
        a, b = 0, 1
        while a < n:
            print(a, end=' ')
            a, b = b, a+b
        print()
    `
    const queries = [fileContent]

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
  })

  it('Should partial match function definition', () => {
    const fileContent = `
      def fib(n):
        a, b = 0, 1
        while a < n:
            print(a, end=' ')
            a, b = b, a+b
        print()
    `
    const queries = [
      `
      def fib(n):
        print()
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
  })

  it('Should partial match function definition using wildcard and alias', () => {
    const fileContent = `
      def fib(n):
        a, b = 0, 1
        while a < n:
            print(a, end=' ')
            a, b = b, a+b
        print()
    `
    const queries = [
      `
      def fib(n):
        $$_refPrint()
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
      end: { line: 7, column: 15, index: 131 },
    })
  })
})
