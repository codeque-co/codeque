import { searchInStrings } from '../../../src/searchInStrings'
import { getParserSettings } from '../../utils'

describe('Wildcards', () => {
  beforeAll(async () => {
    await getParserSettings().init?.()
  })

  it('Should match string wildcard', () => {
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
      "_$$K"
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

  it('Should match node wildcard', () => {
    const fileContent = `
      scopes = function(data)
          data.spreadingFactor = "SF" .. data.spreadingFactor
          local saveResult = config.saveConfig(data)
          setChannel(config.computeFrequency(data.frequency), data.spreadingFactor, data.errorCorrection)
          ws.send(transmissionParamsEvent .. "_ACK", saveResult)
      end
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
      scopes = ws.send(transmissionParamsEvent .. "_ACK", saveResult)
    `

    const queries = [
      `
      scopes = ws.$$()
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
