import { searchInStrings } from '../../../src/searchInStrings'
import { getParserSettings, compareCode } from '../../utils'

describe('Basic queries', () => {
  beforeAll(async () => {
    await getParserSettings().init?.()
  })

  it('Should exact match identifier', async () => {
    const fileContent = `
      print
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

  it('Should exact match function definition', () => {
    const fileContent = `
      function fact (n)
        if n == 0 then
          return 1
        else
          return n * fact(n-1)
        end
      end
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

  it('Should partial match function definition', () => {
    const fileContent = `
      function fact (n)
        if n == 0 then
          return 1
        else
          return n * fact(n-1)
        end
      end
    `
    const queries = [
      `
      function fact (n)
        if n == 0 then
          return 1
        end
      end
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

  it('Should match multiline', () => {
    const fileContent = `
    function setupWS(mode, transmit, setChannel)
      local deviceType = mode == "TX" and "transmitter" or "receiver"
      local url = "ws://" .. loraServerAddress .. "/" .. deviceType
      local headers = {["Authorization"] = "Basic ZnJvZzpoYWt1bmFtYXRhdGE0MzM="}
      local ws = wsModule(url, headers)
      local transmitEvent = "SEND_" .. (mode == "TX" and "TRANSMITTER" or "RECEIVER")
      local transmissionParamsEvent = "TRANSMISSION_PARAMS_" .. (mode == "TX" and "TRANSMITTER" or "RECEIVER")

      ws.on(
          transmitEvent,
          function(data)
              transmit(data.loraPktData)
              ws.send(transmitEvent .. "_ACK", true)
          end
      )

      ws.on(
          transmissionParamsEvent,
          function(data)
              data.spreadingFactor = "SF" .. data.spreadingFactor
              local saveResult = config.saveConfig(data)
              setChannel(config.computeFrequency(data.frequency), data.spreadingFactor, data.errorCorrection)
              ws.send(transmissionParamsEvent .. "_ACK", saveResult)
          end
      )

      return function(data)
          local event = mode == "TX" and "TRANSMITTER_DATA" or "RECEIVER_DATA"
          ws.send(event, data)
      end
  end
    `

    const queries = [
      `
      local transmitEvent = "SEND_" .. (mode == "TX" and "TRANSMITTER" or "RECEIVER")
      local transmissionParamsEvent = "TRANSMISSION_PARAMS_" .. (mode == "TX" and "TRANSMITTER" or "RECEIVER")

      ws.on(
          transmissionParamsEvent,
          function(data)
              data.spreadingFactor = "SF" .. data.spreadingFactor
              local saveResult = config.saveConfig(data)
              setChannel(config.computeFrequency(data.frequency), data.spreadingFactor, data.errorCorrection)
              ws.send(transmissionParamsEvent .. "_ACK", saveResult)
          end
      )
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

    const match = matches[0]

    expect(match.loc).toMatchObject({
      start: { line: 7, column: 6 },
      end: { line: 26, column: 7 },
    })
  })

  it('Should match tuple', () => {
    const fileContent = `
      local var = 1,"text"
    `

    const queries = [
      `
       1,"text"
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

    const match = matches[0]

    expect(match.loc).toStrictEqual({
      start: { line: 2, column: 18, index: 19 },
      end: { line: 2, column: 26, index: 27 },
    })
  })
})
