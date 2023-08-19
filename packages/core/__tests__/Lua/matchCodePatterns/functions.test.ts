import { searchInStrings } from '../../../src/searchInStrings'
import { getParserSettings, compareCode } from '../../utils'

describe('Functions', () => {
  beforeAll(async () => {
    await getParserSettings().init?.()
  })

  it('Should match anonymous function passed as parameter by query with function declaration without name', async () => {
    const fileContent = `
      passCallback(function (a)
        return a
      end
      )
    `
    const queries = [
      `
      function (a)
        return a
      end
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
