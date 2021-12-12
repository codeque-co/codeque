
import { search } from '/search'
import { compareCode } from '/astUtils';
import path from 'path'
import { getFilesList } from '/getFilesList'

const filesList = getFilesList(path.resolve(__dirname, '__fixtures__'))

describe('blocks', () => {
  it('should match exact whole block', () => {
    const queries = [`
      {
        toggleRTL();
        I18nManager.forceRTL(!isRTL);
        Updates.reloadAsync();
      }
      `
    ]

    const results = search({
      mode: 'exact',
      filePaths: filesList,
      queries,
    })

    expect(results.length).toBe(1)
    expect(compareCode(results[0].code, queries[0])).toBeTruthy()
  })


})