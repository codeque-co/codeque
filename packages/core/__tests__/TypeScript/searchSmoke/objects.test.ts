import { getFilesList } from '../../../src/getFilesList'
import { searchInFileSystem } from '../../../src/searchInFs'
import { fixturesPath } from '../../utils'

describe('Objects', () => {
  it('should match possibly repeated object properties', async () => {
    const filesList = await getFilesList({
      searchRoot: fixturesPath,
      omitGitIgnore: true,
    })

    const queries = [
      `
      StyleSheet.create({
        $$: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      });
      `,
    ]

    const { matches, errors } = searchInFileSystem({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries,
    })

    expect(errors).toHaveLength(0)
    expect(matches.length).toBe(2)
  })
})
