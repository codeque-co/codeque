import { search } from '/search'
import { compareCode } from '/astUtils';
import path from 'path'
import { getFilesList } from '/getFilesList'

const filesList = getFilesList(path.resolve(__dirname, '__fixtures__'))

describe('functions', () => {
  it('should match inline types in function params', () => {
    const queries = [`
      const $ = ({
        $,
      }: {
        $: () => $$;
      }) => $$
      `,
      `
        const $ = ({
          $,
        }: {
          $: () => $$;
        }) => {}
      `,
    ]

    const results = search({
      mode: 'include',
      filePaths: filesList,
      queries,
    })

    expect(results.length).toBe(4)
  })
})