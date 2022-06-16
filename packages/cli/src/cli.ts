import { Command } from 'commander'
import { search } from './search'

const program = new Command()

program
  .option(
    '-m, --mode [mode]',
    'search mode: exact, include, include-with-order',
    'include'
  )
  .option(
    '-r, --root [root]',
    'root directory of search (default: process.cwd())'
  )
  .option(
    '-e, --entry [entry]',
    'entry point to resolve files list by dependencies (excluding node_modules)'
  )
  .option(
    '-i, --case-insensitive',
    'perform search with case insensitive mode',
    false
  )
  .option('-l, --limit [limit]', 'limit of results count to display', '20')
  .option('-q, --query [query...]', 'inline search query(s)')
  .option('-qp, --queryPath [queryPath...]', 'path to file with search query')
  .option('-g, --git', 'search in files changed since last git commit', false)
  .option(
    '-iec, --invertExitCode',
    'Return non-zero exit code if matches are found',
    false
  )
  .option('-v, --version', 'print CLI version', false)
  .option('-pfl, --printFilesList', 'print list of searched files', false)
  .action(search)

program.parse(process.argv)
