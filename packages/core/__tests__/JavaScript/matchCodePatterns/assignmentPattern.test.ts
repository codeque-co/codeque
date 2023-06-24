import { searchInStrings } from '../../../src/searchInStrings'

describe('AssignmentPattern improvements in include mode', () => {
  it('should match assignment pattern in function arguments', () => {
    const fileContent = `
        function some(param = null) {

        }
      `

    const queries = [
      `
        function some(param) {

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

  it('should match assignment pattern in function arguments with wildcard', () => {
    const fileContent = `
      function some(param = null) {

      }
      `

    const queries = [
      `
      function some($$) {

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

  it('should match assignment pattern in array destructuring', () => {
    const fileContent = `
        const [data = []] = query
        
      `

    const queries = [
      `
        const [data] = query 
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

  it('should match assignment pattern in array destructuring with wildcard', () => {
    const fileContent = `
        const [data = []] = query 
      `

    const queries = [
      `
        const [$$] = query
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

  it('should match assignment pattern in object destructuring', () => {
    const fileContent = `
         const {data = []} = query
      `

    const queries = [
      `
        const {data} = query
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

  it('should match assignment pattern in object destructuring with wildcard', () => {
    const fileContent = `
        const {data = []} = query  
      `

    const queries = [
      `
        const {$$} = query
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
})
