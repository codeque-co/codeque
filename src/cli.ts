import path from 'path'
import fs from 'fs'
import { search } from '/searchMultiThread'
import { getFilesList } from '/getFilesList'
import { green, magenta, cyan, bold, red, yellow } from "colorette"
import { Mode, getMode, getCodeFrame, print } from '/utils'
import { parseQueries } from '/parseQuery'
import { openAsyncEditor } from '/terminalEditor'
import { Command } from 'commander';
import ora from 'ora'
const program = new Command();

program
  .option('-m, --mode [mode]', 'search mode: exact, include, include-with-order', 'include')
  .option('-r, --root [root]', 'root directory of search (default: process.cwd())')
  .option('-i, --case-insensitive', 'perform search with case insensitive mode', false)
  .option('-l, --limit [limit]', 'limit of results count to display', '20')
  .option('-q, --query [query]', 'path to file with search query')
  .action(
    async ({ mode, caseInsensitive, root = process.cwd(), limit = '20', query: queryPath }: { mode: Mode, caseInsensitive: boolean, root?: string, limit: string, query?: string }) => {
      const resultsLimitCount = parseInt(limit, 10)
      const resolvedRoot = path.resolve(root)

      mode = getMode(mode)

      let prevQuery = ''
      const queryCachePath = path.resolve(__dirname + '/cliQuery')

      try {
        prevQuery = fs.readFileSync(queryCachePath).toString()
      }
      catch (e) { }

      const cols = process.stdout.columns
      const separator = ''.padStart(process.stdout.columns, '━')
      const dot = ' • '

      const modeLabel = 'Mode: '
      const caseLabel = 'Case: '
      const caseText = caseInsensitive ? 'insensitive' : 'sensitive'
      const modeAndCaseText = `${cyan(bold(modeLabel))}${green(mode)}${dot}${cyan(bold(caseLabel))}${green(caseText)}\n`

      const remainingCharsForRoot = cols - modeLabel.length - mode.length - caseLabel.length - caseText.length - dot.length

      const rootLabel = 'Root: '
      const minLen = (dot.length + rootLabel.length + 5)
      const remainingSpaceForRootPath = remainingCharsForRoot - (dot.length + rootLabel.length)
      const charsToReplace = Math.max(resolvedRoot.length - remainingSpaceForRootPath, 0)
      const ellipsis = '...'
      const shortenedRoot = charsToReplace > 0 ? resolvedRoot.replace(new RegExp(`^(.){${charsToReplace + ellipsis.length}}`), ellipsis) : resolvedRoot
      const rootText = remainingCharsForRoot > minLen
        ? `${cyan(bold(rootLabel))
        }${green(shortenedRoot)}${dot}`
        : ''

      let query = ''

      if (queryPath === undefined) {
        query = await openAsyncEditor({ header: `${rootText}${modeAndCaseText}\n✨ Type query:`, code: prevQuery, separator })
        fs.writeFileSync(queryCachePath, query)
      }
      else {
        try {
          query = fs.readFileSync(path.resolve(queryPath)).toString()
        }
        catch (e) {
          print('\n' + red(bold(`Query file not found:`)), path.resolve(queryPath), '\n')
          process.exit(1)
        }
      }

      const startTime = Date.now()

      const [[{ error }], parseOk] = parseQueries([query])

      if (parseOk) {
        print(separator + '\n' + rootText + modeAndCaseText)

        print(cyan(bold('Query:\n\n')) + getCodeFrame(query, 1, true) + '\n')
      }
      else {
        if (query.length > 0) {
          print(red(bold('Query parse error:\n\n')) + getCodeFrame(query, 1, false, error?.location) + '\n')
        }
        print(red(bold('Error:')), error?.text, '\n')

        process.exit(1)
      }

      let spinner = ora(`Getting files list `).start();

      const filePaths = await getFilesList(resolvedRoot)

      spinner.stop()

      spinner = ora(`Searching `).start();

      const results = await search({
        mode,
        filePaths,
        caseInsensitive,
        queryCodes: [query]
      })

      spinner.stop()

      const endTime = Date.now()
      if (results.length > 0) {
        const limitedResults = results.slice(0, resultsLimitCount)
        const resultsText = results.length <= resultsLimitCount ? `Results:\n` : `First ${resultsLimitCount} results:\n`

        print(cyan(bold(resultsText)))

        limitedResults.forEach((result) => {
          const startLine = result.loc.start.line
          const codeFrame = getCodeFrame(result.code, startLine)
          const relativePath = root === process.cwd() ? path.relative(resolvedRoot, result.filePath) : result.filePath
          print(`${green(relativePath)}:${magenta(startLine)}:${yellow(result.loc.start.column + 1)}`)
          print('\n' + codeFrame + '\n')
        })

        print(cyan(bold('Total count:')), magenta(results.length))
      }
      else {
        print(cyan(bold('No results found :c\n')))
      }
      print(cyan(bold('Found in:')), magenta((endTime - startTime) / 1000), 's', '\n')
    })

program.parse(process.argv)