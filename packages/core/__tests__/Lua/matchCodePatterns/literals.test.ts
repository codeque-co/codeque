import { searchInStrings } from '../../../src/searchInStrings'
import { getParserSettings } from '../../utils'

describe('Literals', () => {
  beforeAll(async () => {
    await getParserSettings().init?.()
  })

  it('Should match string literal', () => {
    const fileContent = `
        ws.on(
          transmitEvent,
          function(data)
              transmit(data.loraPktData)
              ws.send(transmitEvent .. "_ACK", true)
          end
        )
    `

    const queries = [
      `
      '_ACK'
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

  it('Should exact match template string literal', () => {
    const fileContent = `
      f"project:{self.project_id}:rules"
    `

    const queries = [
      `
      f"project:{self.project_id}:rules"
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

  it('Should match Integer literal', () => {
    const fileContent = `
      val = 123
    `

    const queries = [
      `
      123
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

  it('Should match Float literal', () => {
    const fileContent = `
      val = 123.123
    `

    const queries = [
      `
      123.123
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

  it('Should match Hex literal', () => {
    const fileContent = `
      val = 0xFF
    `

    const queries = [
      `
      0xFF
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
