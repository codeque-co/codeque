import path from 'path';
import { search } from './src/search';

const queries = [
  `
  import { BlitzPageContext, getSession } from 'blitz';
`,
  `const a = $`,
  `<$></$>`
]

const mockFilePath = path.resolve('./devFile')

const matches = search({
  queries,
  filePaths: [mockFilePath],
  mode: 'include',
  debug: true,
})

console.log(matches)