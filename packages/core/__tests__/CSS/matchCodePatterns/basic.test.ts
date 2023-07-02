import { searchInStrings } from '../../../src/searchInStrings'

describe('Basic queries', () => {
  it('Should exact match rule with selector', () => {
    const fileContent = `
      p {
        background-color: red;
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

  it('Should exact match simple declaration without wrapping block', () => {
    const fileContent = `
      p {
        background-color: red;
      }
    `

    const queries = [`background-color: red;`]

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

  it('Should exact match simple rule without selector', () => {
    const fileContent = `
      p {
        background-color: red;
      }
    `

    const queries = [`{ background-color: red; }`]

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

  it('Should match rule with function property', () => {
    const fileContent = `
      .class {
        background-color: linear-gradient(#e66465, #9198e5);
        display:flex
      }
    `

    const queries = [
      `
      .class {
        background-color: linear-gradient(#e66465, #9198e5);
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

  it('Should match atrule', () => {
    const fileContent = `
      @media (min-width: 300px) {
        #main { 
          font-weight: bold
        }
      }
    `

    const queries = [
      `
        @media (min-width: 300px) {
          #main { 
            font-weight: bold
          }
        }
    `,
    ]

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

  it('Should match rule inside atrule', () => {
    const fileContent = `
      @media (min-width: 300px) {
        #main { 
          font-weight: bold
        }
      }
    `

    const queries = [
      `
        { 
          font-weight: bold
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

  it('Should match selector with combinator', () => {
    const fileContent = `
      ul > li { 
        margin-left: 10px;
      }
    `

    const queries = [
      `
        ul > li { 
          
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

  it('Should match declaration with dimension', () => {
    const fileContent = `
      ul > li { 
        margin-left: 10vw;
      }
    `

    const queries = [
      `
        margin-left: 10vw;
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

  it('Should match calc function and partial selector', () => {
    const fileContent = `
      div, p, span { 
        margin-left: calc(100vw - 90%);
      }
    `

    const queries = [
      `
        p { 
          margin-left: calc(100vw - 90%);
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

  it('Should not match partial selector in exact mode', () => {
    const fileContent = `
      div, p, span { 
        margin-left: calc(100vw - 90%);
      }
    `

    const queries = [
      `
        p { 
          margin-left: calc(100vw - 90%);
        }
      `,
    ]

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
    expect(matches.length).toBe(0)
  })

  it('Should match url', () => {
    const fileContent = `
      div { 
        background: url("http://image.com")
      }
    `

    const queries = [
      `
        div { 
          background: url("http://image.com")
        }
      `,
    ]

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

  it('Should match subset of multi value declaration ', () => {
    const fileContent = `
      div { 
        padding: 10px 8px 4px
      }
    `

    const queries = [
      `
      div { 
        padding: 10px 4px
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
})
