import { searchInFileSystem } from '/searchInFs'
import { compareCode } from '/astUtils'
import path from 'path'
import fs from 'fs'
import { getFilesList } from '/getFilesList'

describe('Types', () => {
  const tempFilePath = path.join(__dirname, `${Date.now()}.temp`)
  const filesList = [tempFilePath]

  beforeAll(() => {
    fs.writeFileSync(
      tempFilePath,
      `
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
    `,
    )
  })

  afterAll(() => {
    fs.unlinkSync(tempFilePath)
  })

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

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(matches.length).toBe(1)
    expect(errors.length).toBe(0)
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

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      caseInsensitive: true,
      queryCodes: queries,
    })

    expect(matches.length).toBe(1)
    expect(errors.length).toBe(0)
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

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(matches.length).toBe(1)
    expect(errors.length).toBe(0)
  })

  it('should match nested object with wildcard', () => {
    const queries = [
      `
      ({
        someOtherKey: $$$,
      })
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(matches.length).toBe(1)
    expect(errors.length).toBe(0)
  })

  it('should find repeating pattern in nested object several times', () => {
    const queries = [
      `
      ({
        a: $$$,
      })
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
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

    expect(matches.length).toBe(4)
    expect(errors.length).toBe(0)

    expect(compareCode(`(${matches[0].code})`, firstMatch)).toBeTruthy()
  })

  it('should not match object if query is block statement', () => {
    const queries = [
      `
      {}
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(matches.length).toBe(0)
    expect(errors.length).toBe(0)
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

    const { matches, errors } = searchInFileSystem({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(matches.length).toBe(1)
    expect(errors.length).toBe(0)
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

    expect(matches.length).toBe(2)
    expect(errors.length).toBe(0)
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

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(matches.length).toBe(5)
    expect(errors.length).toBe(0)
  })
})
