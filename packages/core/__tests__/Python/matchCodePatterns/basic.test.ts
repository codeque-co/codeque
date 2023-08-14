import { searchInStrings } from '../../../src/searchInStrings'
import { getParserSettings, compareCode } from '../../utils'

describe('Basic queries', () => {
  beforeAll(async () => {
    await getParserSettings().init?.()
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

  it('Should match function with return type by query without return type in include mode', () => {
    const fileContent = `
      def accepts() -> str:
        a
    `
    const queries = [
      `
      def accepts():
        a
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

    expect(match.loc).toStrictEqual({
      start: { line: 2, column: 6, index: 7 },
      end: { line: 3, column: 9, index: 38 },
    })
  })

  it('Should match multiline', () => {
    const fileContent = `
      def from_dsn(cls, dsn):
        urlparts = urlparse(dsn)

        public_key = urlparts.username
        project_id = urlparts.path.rsplit("/", 1)[-1]

        try:
            return ProjectKey.objects.get(public_key=public_key, project=project_id)
        except ValueError:
            raise ProjectKey.DoesNotExist("ProjectKey matching query does not exist.")
    `

    const queries = [
      `
      public_key = urlparts.username
      project_id = urlparts.path.rsplit("/", 1)[-1]
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

    expect(match.loc).toStrictEqual({
      start: { line: 5, column: 8, index: 73 },
      end: { line: 6, column: 53, index: 157 },
    })
  })
})
