import { search } from '/search'
import { compareCode } from '/astUtils';
import path from 'path'
import { getFilesList } from '/getFilesList'

const filesList = getFilesList(path.resolve(__dirname, '__fixtures__'))

describe('Other', () => {
  it('should not include the same result twice', () => {
    const queries = [`
      type $ = ScrollViewProps & $
      `,
      `
       type $ = $ & ScrollViewProps
      `
    ]

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queries,
    })

    expect(results.length).toBe(1)
  })

  it('should not include the same result twice 2', () => {
    const queries = [`
      <$$
        $={() => {}}
      />
    `,
      `
      <$$
        $={() => $$}
      />
    `,
      `
      <$$
        $={() => {}}
      >
      </$$>
    `,
      `
      <$$
        $={() => $$}
      >
      </$$>
    `
    ]

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queries,
    })

    expect(results.length).toBe(140)
  })
})