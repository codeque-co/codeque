import { searchInStrings } from '../../../src/searchInStrings'

describe('Wildcard queries', () => {
  it('Should match wildcard in type selector', () => {
    const fileContent = `
      p {
        background-color: red;
      }
    `
    const queries = [
      `
        $$ {
          background-color: red;
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

  it('Should match wildcard in class name', () => {
    const fileContent = `
      .someClass {
        background-color: red;
      }
    `
    const queries = [
      `
        .some$$ {
          background-color: red;
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

  it('Should match wildcard in id selector name', () => {
    const fileContent = `
      #someId {
        background-color: red;
      }
    `
    const queries = [
      `
        #some$$ {
          background-color: red;
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

  it('Should match wildcard in declaration property name', () => {
    const fileContent = `
      p {
        background-color: red;
      }
    `
    const queries = [
      `
        p {
          background-$$: red;
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

  it('Should match wildcard in property color value', () => {
    const fileContent = `
      p {
        background-color: red;
      }
    `
    const queries = [
      `
        p {
          background-color: $$;
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

  it('Should match wildcard in property dimension unit', () => {
    const fileContent = `
      p {
        margin-left: 10em;
      }
    `
    const queries = [
      `
        p {
          margin-left: 10$$; 
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

  it('Should match wildcard in property dimension value', () => {
    const fileContent = `
      p {
        margin-left: 10em;
      }
    `
    const queries = [
      `
        p {
          margin-left: 0x0em; 
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

  it('Should match wildcard in property dimension unit and value', () => {
    const fileContent = `
      p {
        margin-left: 10em;
      }
    `
    const queries = [
      `
        p {
          margin-left: 0x0$$
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

  it('Should match wildcard in media query identifier', () => {
    const fileContent = `
      @media screen and (min-width: 480px) {
        body {
            background-color: lightgreen;
        }
      }
    `
    const queries = [
      `
        @media $$ and (min-width: 480px) {
          body {
              background-color: lightgreen;
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

  it('Should match wildcard in media query media feature name', () => {
    const fileContent = `
      @media screen and (min-width: 480px) {
        body {
            background-color: lightgreen;
        }
      }
    `
    const queries = [
      `
        @media screen and ($$: 480px) {
          body {
              background-color: lightgreen;
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

  it('Should match numeric wildcard in media query media feature dimension value', () => {
    const fileContent = `
      @media screen and (min-width: 480px) {
        body {
            background-color: lightgreen;
        }
      }
    `
    const queries = [
      `
        @media screen and (min-width: 0x0px) {
          body {
              background-color: lightgreen;
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

  it('Should match wildcard in keyframes name', () => {
    const fileContent = `
      @keyframes slidein {
        from {
          transform: translateX(0%);
        }
      
        to {
          transform: translateX(100%);
        }
      }
    `
    const queries = [
      `
        @keyframes $$ {
          from {
            transform: translateX(0%);
          }
        
          to {
            transform: translateX(100%);
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

  it('Should match wildcard in keyframes type selector', () => {
    const fileContent = `
      @keyframes slidein {
        from {
          transform: translateX(0%);
        }
      
        to {
          transform: translateX(100%);
        }
      }
    `
    const queries = [
      `
        @keyframes slidein {
          $$ {
            transform: translateX(0%);
          }
        
          to {
            transform: translateX(100%);
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

  it('Should match wildcard in keyframes percentage selector', () => {
    const fileContent = `
      @keyframes slidein {
        0% {
          transform: translateX(0%);
        }
      
        100% {
          transform: translateX(100%);
        }
      }
    `
    const queries = [
      `
        @keyframes slidein {
          0% {
            transform: translateX(0%);
          }
        
          0x0% {
            transform: translateX(100%);
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

  it('Should match wildcard in url function value 1', () => {
    const fileContent = `
      p {
        background: url("some-path")
      }
    `
    const queries = [
      `
        p {
          background: url($$)
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

  it('Should match wildcard in url function value 2', () => {
    const fileContent = `
      p {
        background: url("some-path")
      }
    `
    const queries = [
      `
        p {
          background: url("$$")
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

  it('Should match wildcard in function name', () => {
    const fileContent = `
      p {
        background: linear-gradient(0px)
      }
    `
    const queries = [
      `
        p {
          background: $$(0px)
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

  it('Should match color hash with string wildcard', () => {
    const fileContent = `
      p {
        background: #000
      }
    `
    const queries = [
      `
        p {
          background: $$
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

  it('Should match color hash with numeric wildcard', () => {
    const fileContent = `
      p {
        background: #000
      }
    `
    const queries = [
      `
        p {
          background: #0x0
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
})
