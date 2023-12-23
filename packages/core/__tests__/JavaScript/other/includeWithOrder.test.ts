import { searchInStrings } from '../../../src/searchInStrings'

describe('include-with-order wildcards', () => {
  it('Should properly match several function arguments using node tree wildcards', () => {
    const fileContent = `
      useQuery(API.path, { param : 'value' }, { suspense: true })
    `

    const queries = [
      `
      useQuery($$$, $$$, { suspense: true })
     `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include-with-order',
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

  it('Should properly match several function parameters ', () => {
    const fileContent = `
      function func(arg1, arg2 = "test") {}
    `

    const queries = [
      `
       function func($$, arg2 = "test") {}
    `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include-with-order',
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

  it('Should properly match several function parameters 2', () => {
    const fileContent = `
      function func(arg1, arg2 = "test") {}
    `

    const queries = [
      `
       function func(arg1, $$$) {}
    `,
    ]

    const { matches, errors } = searchInStrings({
      mode: 'include-with-order',
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
