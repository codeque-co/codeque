import { searchInStrings } from '../../../src/searchInStrings'
import { getParserSettings } from '../../utils'

describe('Wildcards', () => {
  beforeAll(async () => {
    await getParserSettings().init?.()
  })

  it('Should match string wildcard', () => {
    const fileContent = `
        using System;

        var langLabel = "Csharp";
        Console.WriteLine("Csharp");
    `

    const queries = [
      `
      "Cs$$"
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
    expect(matches.length).toBe(2)
  })

  it('Should match node wildcard', () => {
    const fileContent = `
        using System;

        var langLabel = "Csharp";
        Console.WriteLine("Csharp");
    `

    const queries = [
      `
      var langLabel = $$$;
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

  it('Should match identifier wildcard', () => {
    const fileContent = `
        using System;

        var langLabel = "Csharp";
        Console.WriteLine("Csharp");
    `

    const queries = [
      `
      Console.$$();
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

  it('Should match integer wildcard', () => {
    const fileContent = `
        using System;

        var duration = 3600;
    `

    const queries = [
      `
      0x0
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

  it('Should match float wildcard', () => {
    const fileContent = `
        using System;

        var ratio = 2.33;
    `

    const queries = [
      `
      0x0
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
