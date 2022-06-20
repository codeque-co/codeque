import commander from 'commander'
import { search } from './search'

export function createCliProgram(program: commander.Command) {
  program
    .description(
      'Opens interactive terminal editor to type query and performs structural code search in current working directory. Alternatively performs search based on query option or query file.'
    )
    .option(
      '-m, --mode [mode]',
      'Search mode: exact, include, include-with-order, text',
      'include'
    )
    .option(
      '-r, --root [root]',
      'Root directory for search (default: process.cwd())'
    )
    .option(
      '-e, --entry [entry]',
      //eslint-disable-next-line prettier/prettier, no-useless-escape
      `Entry point to determine search files list based on it's imports (excluding nodeˍmodules)`
    )
    .option(
      '-i, --caseInsensitive',
      'Perform search with case insensitive mode',
      false
    )
    .option('-l, --limit [limit]', 'Limit of results count to display', '20')
    .option('-q, --query [query...]', 'Inline search query(s)')
    .option(
      '-qp, --queryPath [queryPath...]',
      'Path to file(s) with search query(s)'
    )
    .option('-g, --git', 'Search in files changed since last git commit', false)
    .option(
      '-iec, --invertExitCode',
      'Return non-zero exit code if matches are found. Useful for creating assertions',
      false
    )
    .option('-v, --version', 'Print CLI version', false)
    .option('-pfl, --printFilesList', 'Print list of searched files', false)
    .option(
      '-ogi, --omitGitIgnore',
      'Search files regardless .gitignore settings',
      false
    )
    .action(search)
}
