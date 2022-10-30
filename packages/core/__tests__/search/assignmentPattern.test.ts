import { searchInFileSystem } from '/searchInFs'
import { compareCode } from '/astUtils'
import path from 'path'
import { getFilesList } from '/getFilesList'
import { searchInStrings } from '../../src/searchInStrings'

describe('AssignmentPattern improvements in include mode', () => {
  let filesList = [] as string[]

  beforeAll(async () => {
    filesList = await getFilesList({
      searchRoot: path.resolve(__dirname, '__fixtures__'),
      omitGitIgnore: true,
    })
  })

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

    expect(matches.length).toBe(1)
    expect(errors.length).toBe(0)
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

    expect(matches.length).toBe(1)
    expect(errors.length).toBe(0)
  })

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

    expect(matches.length).toBe(1)
    expect(errors.length).toBe(0)
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

    expect(matches.length).toBe(0)
    expect(errors.length).toBe(0)
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

    expect(matches.length).toBe(1)
    expect(errors.length).toBe(0)
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

    expect(matches.length).toBe(1)
    expect(errors.length).toBe(0)
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

    expect(matches.length).toBe(1)
    expect(errors.length).toBe(0)
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

    expect(matches.length).toBe(1)
    expect(errors.length).toBe(0)
  })
})
