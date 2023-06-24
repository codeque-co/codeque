import { searchInStrings } from '../../../src/searchInStrings'

describe('AssignmentPattern improvements in include mode', () => {
  it('should match assignment pattern in function arguments type annotation', () => {
    const fileContent = `
      function some(param: [] | null = null) {

      }
      `

    const queries = [
      `
        function some(param: [] | null) {

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

  it('should not match assignment pattern in function arguments with wildcard but without types', () => {
    const fileContent = `
        function some(param = null) {

        }
      `

    const queries = [
      `
        function some($$: [] | null = null) {

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
    expect(matches.length).toBe(0)
  })
})
