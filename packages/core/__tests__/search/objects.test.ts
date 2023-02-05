import { searchInFileSystem } from '/searchInFs'
import { compareCode } from '../utils'
import path from 'path'
import { getFilesList } from '/getFilesList'
import { searchInStrings } from '../../src/searchInStrings'

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

    expect(errors.length).toBe(0)
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

    expect(errors.length).toBe(0)
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

    expect(errors.length).toBe(0)
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

    expect(errors.length).toBe(0)
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

    expect(errors.length).toBe(0)
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

    expect(errors.length).toBe(0)
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

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match possibly repeated object properties', async () => {
    const filesList = await getFilesList({
      searchRoot: path.resolve(__dirname, '__fixtures__'),
      omitGitIgnore: true,
    })

    const queries = [
      `
      StyleSheet.create({
        $$: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      });
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(2)
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

    expect(errors.length).toBe(0)
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

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })

  it('should match OptionalMemberExpression and non-optional MemberExpression interchangeably in include mode object property before rename', () => {
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
})
