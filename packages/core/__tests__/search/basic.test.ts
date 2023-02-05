import { searchInStrings } from '../../src/searchInStrings'

describe('Basic queries', () => {
  it('Should match identifier in file', () => {
    const fileContent = `const someId = 'aaa'`

    const queries = [`someId`]

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

    expect(errors.length).toBe(0)
    expect(matches.length).toBe(1)
  })
})
