import { searchInStrings } from '../../../src/searchInStrings'
import { getParserSettings, compareCode } from '../../utils'

describe('Tables', () => {
  beforeAll(async () => {
    await getParserSettings().init?.()
  })

  it('Should match table with keys exact', async () => {
    const fileContent = `
      local header = {
        operationType = sdLib.operationTypeNumbers.repeater_telemetry,
        transactionNumber = "0"
      }
    `

    const queries = [
      `
      {
        operationType = sdLib.operationTypeNumbers.repeater_telemetry,
        transactionNumber = "0"
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

    expect(matches[0].loc).toMatchObject({
      start: {
        line: 2,
        column: 21,
      },
      end: { line: 5, column: 7 },
    })
  })

  it('Should match table with keys partial', async () => {
    const fileContent = `
      local header = {
        operationType = sdLib.operationTypeNumbers.repeater_telemetry,
        transactionNumber = "0"
      }
    `

    const queries = [
      `
      {
        transactionNumber = "0"
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

  it('Should match table with values exact', async () => {
    const fileContent = `
      local header = {
        "text", 123, {nested = 'table'}
      }
    `

    const queries = [
      `
      {
        "text", 123, {nested = "table"}
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
