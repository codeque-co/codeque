import { searchInStrings } from '../../../src/searchInStrings'
import { getParserSettings } from '../../utils'

describe('Basic queries', () => {
  beforeAll(async () => {
    await getParserSettings().init?.()
  })

  it('Should exact match identifier', async () => {
    const fileContent = `
        using System;

        Console.WriteLine("Hello");
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
        using System;

        class TestClass
        {
            public static void Main(){}

            static void Fib(int n)
            {
                var init = (0, 1);
                var (a, b) = init;
                while (a < n)
                {
                    Console.Write($"{a} ");
                    (a, b) = (b, a + b);
                }
                Console.WriteLine();
            }
        }
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
        using System;

        class TestClass
        {
            public static void Main(){}

            static void Fib(int n)
            {
                var init = (0, 1);
                var (a, b) = init;
                while (a < n)
                {
                    Console.Write($"{a} ");
                    (a, b) = (b, a + b);
                }
                Console.WriteLine();
            }
        }
      `

    const queries = [
      `
      class TestClass
      {
        void Fib(int n)
        {
          Console.WriteLine();
        }
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

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('Should match multiline', () => {
    const fileContent = `
        using System;

        class TestClass
        {
            public static void Main(){}

            static void Fib(int n)
            {
                var init = (0, 1);
                var (a, b) = init;
                while (a < n)
                {
                    Console.Write($"{a} ");
                    (a, b) = (b, a + b);
                }
                Console.WriteLine();
            }
        }
      `

    const queries = [
      `
      class TestClass
      {
          void Fib(int n)
          {
              var init = (0, 1);
              var (a, b) = init;
          }
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

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)

    const match = matches[0]

    expect(match.loc).toStrictEqual({
      start: { line: 4, column: 8, index: 32 },
      end: { line: 19, column: 9, index: 429 },
    })
  })
})
