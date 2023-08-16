import { searchInStrings } from '../../../src/searchInStrings'
import { getParserSettings } from '../../utils'

describe('Wildcards', () => {
  beforeAll(async () => {
    await getParserSettings().init?.()
  })

  it('Should match string wildcard', () => {
    const fileContent = `
      scopes = BitField(
        flags=(
            ("project:read", "project:read")
        )
      )
    `

    const queries = [
      `
      "pro$$t:read"
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
      scopes = BitField(
        flags=(
            ("project:read", "project:read")
        )
      )
    `

    const queries = [
      `
      scopes = $$$
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
      scopes = BitField(
        flags=(
            ("project:read", "project:read")
        )
      )
    `

    const queries = [
      `
      scopes = $$()
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
      val = 123
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
      val = 123.123
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
