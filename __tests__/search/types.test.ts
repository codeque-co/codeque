import { search } from '/search'
import { compareCode } from '/astUtils';
import path from 'path'
import { getFilesList } from '/getFilesList'

const filesList = getFilesList(path.resolve(__dirname, '__fixtures__'))

describe('Types', () => {
  it('should match type that concatenates other type', () => {
    const queries = [`
      type $ = ScrollViewProps & $
      `,
    ]

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queries,
    })

    expect(results.length).toBe(1)
  })
})