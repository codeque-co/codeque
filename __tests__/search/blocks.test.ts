
import { search } from '/search'
import { compareCode } from '/astUtils';
import path from 'path'
import { getFilesList } from '/getFilesList'


describe('blocks', () => {
  let filesList = [] as string[]

  beforeAll(async () => {
     filesList = await getFilesList(path.resolve(__dirname, '__fixtures__'))
  })

  it('should match exact whole block', () => {
    const queries = [`
      {
        toggleRTL();
        I18nManager.forceRTL(!isRTL);
        Updates.reloadAsync();
      }
      `
    ]

    const { matches } = search({
      mode: 'exact',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(matches.length).toBe(1)
    expect(compareCode(matches[0].code, queries[0])).toBeTruthy()
  })


})