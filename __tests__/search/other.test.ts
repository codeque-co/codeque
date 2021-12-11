import { search } from '/search'
import { compareCode } from '/astUtils';
import path from 'path'
import { getFilesList } from '/getFilesList'

const filesList = getFilesList(path.resolve(__dirname, '__fixtures__'))

describe('Other', () => {
  it('should find all console logs', () => {
    const query = `
      console.log()
    `
    const results = search({
      mode: 'include',
      filePaths: filesList,
      queries: [query],
    })

    expect(results.length).toBe(3)
    expect(results[2].code).toBe("console.log('Pressed')")
  })
})