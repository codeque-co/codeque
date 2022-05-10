import { search } from '/search'
import path from 'path'
import { getFilesList } from '/getFilesList'

describe('Other', () => {
  let filesList = [] as string[]

  beforeAll(async () => {
    filesList = await getFilesList(path.resolve(__dirname, '__fixtures__'))
  })

  it('should not include the same result twice', () => {
    const queries = [
      `
      type $$ = ScrollViewProps & $$$
      `,
      `
       type $$ = $$$ & ScrollViewProps
      `
    ]

    const { matches } = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(1)
  })

  it('should not include the same result twice 2', () => {
    const queries = [
      `
      <$$$
        $$={() => {}}
      />
    `,
      `
      <$$$
        $$={() => $$$}
      />
    `,
      `
      <$$$
        $$={() => {}}
      >
      </$$$>
    `,
      `
      <$$$
        $$={() => $$$}
      >
      </$$$>
    `
    ]

    const { matches } = search({
      mode: 'include',
      filePaths: filesList,
      queryCodes: queries
    })

    expect(matches.length).toBe(190)
  })
})
