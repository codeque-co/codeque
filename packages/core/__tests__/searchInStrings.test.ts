import { searchInStrings } from '/searchInStrings'

describe('Search in strings', () => {
  jest.mock('fs', () => {
    const throwOnUsage = (...args: any[]) => {
      console.log(...args)
      throw new Error('FS module is not allowed in search in strings')
    }

    return {
      readFileSync: throwOnUsage,
    }
  })

  it('should search in strings', () => {
    const file1 = `
      function A() {
        const b = 'c'
        return {
          "firstName": 'John',
          age: 5
        }
      }
    `

    const file2 = `
      {
        "users": [
          {
            "firstName": "John",
            "lastName": "Doe"
          },
          {
            "firstName": "Joe",
            "lastName": "Hey"
          }
        ]
      }
    `
    const query = `
      ({
        "firstName" : 'John'
      })
    `

    const results = searchInStrings({
      mode: 'include',
      queryCodes: [query],
      files: [
        {
          content: file1,
          path: 'file1.js',
        },
        {
          content: file2,
          path: 'file2.json',
        },
      ],
    })

    expect(results.errors).toHaveLength(0)
    expect(results.matches.length).toBe(2)
  })
})
