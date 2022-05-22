import path from 'path'
import fs from 'fs'
import { search } from '/searchMultiThread'
import { getFilesList } from '/getFilesList'
import { green, magenta, cyan, bold, red, yellow } from 'colorette'
import { Mode, getMode, getCodeFrame, print } from '/utils'
import { parseQueries } from '/parseQuery'
import { openAsyncEditor } from '/terminalEditor'
import { Command } from 'commander'
import ora from 'ora'
import { textSearch } from './textSearch'

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
  .action(
    async ({
      mode,
      caseInsensitive,
      root = process.cwd(),
      limit,
      queryPath: queryPaths = [],
      query: queries = [],
      entry,
      git,
      invertExitCode
    }: {
      mode: Mode
      caseInsensitive: boolean
      root?: string
      limit: string
      query: string[]
      queryPath?: string[]
      entry?: string
      git: boolean
      invertExitCode?: boolean
    }) => {
      const resultsLimitCount = parseInt(limit, 10)
      const resolvedRoot = path.resolve(root)

      mode = getMode(mode)

      let prevQuery = ''
      const queryCachePath = path.resolve(__dirname + '/cliQuery')

      try {
        prevQuery = fs.readFileSync(queryCachePath).toString()
      } catch (e) {
        e
      }

      const cols = process.stdout.columns
      const separator = ''.padStart(process.stdout.columns, '━')
      const dot = ' • '

      const modeLabel = 'Mode: '
      const caseLabel = 'Case: '
      const caseText = caseInsensitive ? 'insensitive' : 'sensitive'
      const modeAndCaseText = `${cyan(bold(modeLabel))}${green(
        mode
      )}${dot}${cyan(bold(caseLabel))}${green(caseText)}\n`

      const remainingCharsForRoot =
        cols -
        modeLabel.length -
        mode.length -
        caseLabel.length -
        caseText.length -
        dot.length

      const rootLabel = 'Root: '
      const minLen = dot.length + rootLabel.length + 5
      const remainingSpaceForRootPath =
        remainingCharsForRoot - (dot.length + rootLabel.length)
      const charsToReplace = Math.max(
        resolvedRoot.length - remainingSpaceForRootPath,
        0
      )
      const ellipsis = '...'
      const shortenedRoot =
        charsToReplace > 0
          ? resolvedRoot.replace(
              new RegExp(`^(.){${charsToReplace + ellipsis.length}}`),
              ellipsis
            )
          : resolvedRoot
      const rootText =
        remainingCharsForRoot > minLen
          ? `${cyan(bold(rootLabel))}${green(shortenedRoot)}${dot}`
          : ''

      if (queries.length === 0 && queryPaths.length === 0) {
        const q = await openAsyncEditor({
          header: `${rootText}${modeAndCaseText}\n✨ Type query:`,
          code: prevQuery,
          separator
        })
        fs.writeFileSync(queryCachePath, q)
        queries = [q]
      } else if (queryPaths.length > 0) {
        try {
          queries = queryPaths.map((qp) =>
            fs.readFileSync(path.resolve(qp)).toString()
          )
        } catch (e: any) {
          print('\n' + red(bold(`Query file not found:`)), e.message, '\n')
          process.exit(1)
        }
      }

      const startTime = Date.now()

      const [results, parseOk] = parseQueries(queries)
      if (mode === 'text') {
        print(separator + '\n' + rootText + modeAndCaseText)
        queries.forEach((q) => {
          print(cyan(bold('Query:\n\n')) + q + '\n')
        })
      } else if (parseOk) {
        print(separator + '\n' + rootText + modeAndCaseText)
        queries.forEach((q) => {
          print(cyan(bold('Query:\n\n')) + getCodeFrame(q, 1, true) + '\n')
        })
      } else {
        queries.forEach((q, index) => {
          const error = results[index].error
          if (error) {
            if (q.length > 0) {
              print(
                red(bold('Query parse error:\n\n')),
                getCodeFrame(q, 1, false, error?.location),
                '\n'
              )
            }
            print(red(bold('Error:')), error?.text, '\n')
          }
        })
        process.exit(1)
      }

      let spinner = ora(`Getting files list `).start()
      const searchFN = mode === 'text' ? textSearch : search
      const filePaths = await getFilesList(resolvedRoot, entry, git)
      spinner.stop()
      spinner = ora(`Searching `).start()
      const { matches, errors } = await searchFN({
        mode,
        filePaths,
        caseInsensitive,
        queryCodes: queries
      })
      spinner.stop()

      const endTime = Date.now()
      if (matches.length > 0) {
        const limitedResults = matches.slice(0, resultsLimitCount)
        const resultsText =
          matches.length <= resultsLimitCount
            ? `Results:\n`
            : `First ${resultsLimitCount} results:\n`

        print(cyan(bold(resultsText)))

        limitedResults.forEach((result) => {
          const resultCode = result.extendedCodeFrame
            ? result.extendedCodeFrame.code
            : result.code
          const matchStartLine = result.loc.start.line
          const codeFrameStartLine = result.extendedCodeFrame
            ? result.extendedCodeFrame.startLine
            : matchStartLine

          const codeFrame = getCodeFrame(resultCode, codeFrameStartLine)
          const relativePath =
            root === process.cwd()
              ? path.relative(resolvedRoot, result.filePath)
              : result.filePath
          print(
            `${green(relativePath)}:${magenta(matchStartLine)}:${yellow(
              result.loc.start.column + 1
            )}`
          )
          print('\n' + codeFrame + '\n')
        })

        print(cyan(bold('Total count:')), magenta(matches.length))
      } else {
        print(cyan(bold('No results found :c')))
      }

      print(cyan(bold('Found in:')), magenta((endTime - startTime) / 1000), 's')
      print(cyan(bold('Searched files:')), magenta(filePaths.length))

      if (errors.length > 0) {
        print(
          red(bold('Search failed for:')),
          magenta(errors.length),
          'file(s)'
        )
      }

      print('') // new line

      const hasMatches = matches.length > 0
      const shouldFail = hasMatches === invertExitCode
      process.exit(shouldFail ? 1 : 0)
    }
  )

program.parse(process.argv)
