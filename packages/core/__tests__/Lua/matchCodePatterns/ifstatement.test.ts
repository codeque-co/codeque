import { searchInStrings } from '../../../src/searchInStrings'
import { getParserSettings, compareCode } from '../../utils'

describe('If statement', () => {
  beforeAll(async () => {
    await getParserSettings().init?.()
  })

  it('Should match any if statement ', async () => {
    const fileContent = `
      if (a) then b() else c() end
    `
    const queries = [
      `
      if () then  else  end
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
