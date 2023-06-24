import { createLogger } from '../../../src/logger'
import { parseQueries } from '../../../src/parseQuery'
import { searchInStrings } from '../../../src/searchInStrings'
import { searchAst } from '../../../src/searchStages/searchAst'
import { NotNullParsedQuery } from '../../../src/types'
import {
  compareCode,
  getParserSettings,
  parserType,
  fixturesPath,
} from '../../utils'
import { getFilesList } from '../../../src/getFilesList'
import { searchInFileSystem } from '../../../src/searchInFs'

describe('Objects', () => {
  const testFile = `
    ({
      a : {
        b : {
          a : {
            b : {
              a : {
                b : {

                }
              }
            }
          }
        }
      }
    });

    const obj = {
      someKey: someVal,
      someOtherKey: {
        a:5
      },
      other: 'other'
    }

    const objWithFn = {
      someKey: someVal,
      fn: () => obj.other
    }

    const objWithEquivalentKeys1 = {
      5: "val1",
    }

    const objWithEquivalentKeys2 = {
      ["5"]: "val2",
    }

    const objWithEquivalentKeys3 = {
      "5": "val3"
    }

    const objWithEquivalentKeys4 = {
      "aaa": "val4"
    }

    const objWithEquivalentKeys5 = {
      aaa: "val5"
    }
  `

  it('should match exact object', () => {
    const queries = [
      `
      ({
        someKey: someVal,
        someOtherKey: {
          a:5
        },
        other: 'other'
      })
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'exact',
      files: [
        {
          path: 'mock',
          content: testFile,
        },
      ],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('should match exact object case insensitive', () => {
    const queries = [
      `
      ({
        somekey: SomeVal,
        someOtherKey: {
          A:5
        },
        other: 'OTHER'
      })
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'exact',
      files: [
        {
          path: 'mock',
          content: testFile,
        },
      ],
      caseInsensitive: true,
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('should match nested object property with wildcard', () => {
    const queries = [
      `
      ({
        someOtherKey: {
          $$:5
        },
      })
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [
        {
          path: 'mock',
          content: testFile,
        },
      ],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('should match nested object with wildcard', () => {
    const queries = [
      `
      ({
        someOtherKey: $$$,
      })
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [
        {
          path: 'mock',
          content: testFile,
        },
      ],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('should find repeating pattern in nested object several times', () => {
    const queries = [
      `
      ({
        a: $$$,
      })
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [
        {
          path: 'mock',
          content: testFile,
        },
      ],
      queryCodes: queries,
    })

    const firstMatch = `
      ({
        a : {
          b : {
            a : {
              b : {
                a : {
                  b : {

                  }
                }
              }
            }
          }
        }
      });
    `

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(4)

    expect(compareCode(`(${matches[0].code})`, firstMatch)).toBeTruthy()
  })

  it('should not match object if query is block statement', () => {
    const queries = [
      `
      {}
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [
        {
          path: 'mock',
          content: testFile,
        },
      ],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1) // It used to be 0, but now `{}` matches program as a block matches program
  })

  it('should match function in object', () => {
    const queries = [
      `
      ({
        $$: $$,
        $$: () => $$$
      })
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'exact',
      files: [
        {
          path: 'mock',
          content: testFile,
        },
      ],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('should match equivalent object keys', () => {
    const queries = [
      `
      ({
        5: $$$
      })
      `,
      `
      ({
        aaa: "val$$"
      })
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [
        {
          path: 'mock',
          content: testFile,
        },
      ],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(5)
  })

  it('should match destructured object property before rename', () => {
    const testFile = `
      const { node: someNode } = useForm()
    `
    const queries = [
      `
        const { node } = useForm()
      `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [
        {
          path: 'mock',
          content: testFile,
        },
      ],
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  /**
   * Esprima does not support optional chaining
   */
  if (parserType !== 'esprima') {
    it('should match OptionalMemberExpression and non-optional MemberExpression interchangeably in include mode', () => {
      const testFile = `
      obj?.field?.field
      obj.field.field
      obj?.field.field
      obj.field?.field
    `

      const query1 = `
        obj.field.field
      `
      const query2 = `
        obj?.field?.field
      `

      const { matches: matches1, errors: errors1 } = searchInStrings({
        mode: 'include',
        files: [
          {
            path: 'mock',
            content: testFile,
          },
        ],
        queryCodes: [query1],
      })

      const { matches: matches2, errors: errors2 } = searchInStrings({
        mode: 'include',
        files: [
          {
            path: 'mock',
            content: testFile,
          },
        ],
        queryCodes: [query2],
      })

      expect(errors1.length).toBe(0)
      expect(matches1.length).toBe(4)

      expect(errors2.length).toBe(0)
      expect(matches2.length).toBe(4)
    })

    it('should match OptionalMemberExpression and non-optional MemberExpression interchangeably in include mode when assigned to variables', () => {
      const testFile = `
      const a = obj?.field?.field
      const b = obj.field.field
      const c = obj?.field.field
      const d = obj.field?.field
    `

      const query1 = `
        obj.field.field
      `
      const query2 = `
        obj?.field?.field
      `

      const { matches: matches1, errors: errors1 } = searchInStrings({
        mode: 'include',
        files: [
          {
            path: 'mock',
            content: testFile,
          },
        ],
        queryCodes: [query1],
      })

      const { matches: matches2, errors: errors2 } = searchInStrings({
        mode: 'include',
        files: [
          {
            path: 'mock',
            content: testFile,
          },
        ],
        queryCodes: [query2],
      })

      expect(errors1.length).toBe(0)
      expect(matches1.length).toBe(4)

      expect(errors2.length).toBe(0)
      expect(matches2.length).toBe(4)
    })
  }

  it('should match chain expression start with nodes tree wildcard', () => {
    const testFile = `
    z.string().optional().nullable()
    `

    const query = `
      $$$.optional().nullable()
    `

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [
        {
          path: 'mock',
          content: testFile,
        },
      ],
      queryCodes: [query],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  // TODO support this
  it.skip('should match chain expression using optional chain query with call expression at the end', () => {
    const testFile = `
      z.string.nullable()
    `

    const query = `
      z?.sting?.nullable()
    `

    const { matches, errors } = searchInStrings({
      mode: 'include',
      files: [
        {
          path: 'mock',
          content: testFile,
        },
      ],
      queryCodes: [query],
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(1)
  })

  it('should match chain expression start with nodes tree wildcard in AST search inside raw AST node', () => {
    const parserSettings = getParserSettings()
    const searchSettings = {
      mode: 'include' as const,
      caseInsensitive: true,
      parserSettings,
      logger: createLogger(),
    }
    const testFile = `
      z.string().optional().nullable()
    `

    const query = `
      $$$.optional().nullable()
    `

    const fileNode = parserSettings.parseCode(testFile, '')

    // 👈 unwrap program node to mimic behavior of query builder search
    const extractedFileNode = parserSettings.unwrapExpressionStatement(
      parserSettings.getProgramBodyFromRootNode(fileNode)[0],
    )

    const [queries, parseOk] = parseQueries(
      [query],
      searchSettings.caseInsensitive,
      searchSettings.parserSettings,
    )

    const { matches } = searchAst(
      extractedFileNode,
      {
        queries: queries as NotNullParsedQuery[],
        ...searchSettings,
        getCodeForFileNode: () => '',
      },
      false, // 👈 not unwrap program node inside searchAst
    )[0]

    expect(extractedFileNode.type).toBe('CallExpression')
    expect(queries?.[0]?.queryNode?.type).toBe('CallExpression')
    expect(matches.length).toBe(1)
  })

  it('should match possibly repeated object properties', async () => {
    const fileContent = `
      StyleSheet.create({
        a: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        b: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      });
    `

    const queries = [
      `
      StyleSheet.create({
        $$: $$$_one,
        $$: $$$_one,
      });
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
