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
      let prevQuery = ''

      try {
        prevQuery = fs.readFileSync(path.resolve('./cliQuery')).toString()
      }
      catch (e) { }

      const separator = '\n'.padStart(process.stdout.columns, '━')
      const rootText = `${cyan(bold('Root:'))} ${green(resolvedRoot)}\n`
      const modeAndCaseText = `${separator}${rootText}${cyan(bold('Mode:'))} ${green(mode)}   ${cyan(bold('Case:'))} ${green(caseInsensitive ? 'insensitive' : 'sensitive')}\n`
      let query = ''

      if (queryPath === undefined) {
        query = await openAsyncEditor({ header: `${modeAndCaseText}\n✨ Type query:`, code: prevQuery })
        fs.writeFileSync(path.resolve('./cliQuery'), query)
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
        print(modeAndCaseText)

        print(cyan(bold('Query:\n\n')) + getCodeFrame(query, 1, true) + '\n')
      }
      else {
        if (query.length > 0) {
          print(red(bold('Query parse error:\n\n')) + getCodeFrame(query, 1, false, error?.location) + '\n')
        }
        print(red(bold('Error:')), error?.text, '\n')

        process.exit(1)
      }
      const spinner = ora(`Searching`).start();

      const results = await search({
        mode,
        filePaths: getFilesList(resolvedRoot),
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