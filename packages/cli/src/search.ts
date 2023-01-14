import {
  Mode,
  getCodeFrame,
  getFilesList,
  getMode,
  groupMatchesByFile,
  parseQueries,
  searchMultiThread,
} from '@codeque/core'
import { blue, bold, cyan, green, magenta, red, yellow } from 'colorette'
import fs from 'fs'
import ora from 'ora'
import path from 'path'
import { openAsyncEditor } from './terminalEditor'
import {
  prepareHintText,
  print,
  textEllipsis,
  printVersionNumber,
} from './utils'
import { waitForSearchDecision } from './waitForSearchDecision'

type CliParams = {
  mode: Mode
  caseInsensitive: boolean
  root?: string
  limit: string
  query: string[]
  queryPath?: string[]
  entry?: string
  git: boolean
  invertExitCode: boolean
  version: boolean
  printFilesList: boolean
  omitGitIgnore: boolean
  allExtensions: boolean
}

export async function search(params: CliParams) {
  const {
    caseInsensitive,
    root = process.cwd(),
    limit,
    queryPath: queryPaths = [],
    entry,
    git,
    invertExitCode,
    version,
    printFilesList,
    omitGitIgnore,
    allExtensions,
  } = params

  let { mode, query: queries = [] } = params

  if (version) {
    return printVersionNumber()
  }

  const shouldOpenEditor = queries.length === 0 && queryPaths.length === 0
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
  const modeAndCaseText = `${cyan(bold(modeLabel))}${green(mode)}${dot}${cyan(
    bold(caseLabel),
  )}${green(caseText)}\n`

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
  const shortenedRoot = textEllipsis(resolvedRoot, remainingSpaceForRootPath)
  const rootText =
    remainingCharsForRoot > minLen
      ? `${cyan(bold(rootLabel))}${green(shortenedRoot)}${dot}`
      : ''

  if (shouldOpenEditor) {
    const q = await openAsyncEditor({
      header: `${rootText}${modeAndCaseText}\n✨ Type query:`,
      code: prevQuery,
      separator,
    })
    fs.writeFileSync(queryCachePath, q)
    queries = [q]
  } else if (queryPaths.length > 0) {
    try {
      queries = queryPaths.map((qp) =>
        fs.readFileSync(path.resolve(qp)).toString(),
      )
    } catch (e: any) {
      print('\n' + red(bold(`Query file not found:`)), e.message, '\n')
      process.exit(1)
    }
  }

  const startTime = Date.now()

  const [queryParseResults, parseOk] = parseQueries(queries, caseInsensitive)

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
      const error = queryParseResults[index].error
      const hints = queryParseResults[index].hints

      if (error) {
        if (q.length > 0) {
          print(
            red(bold('Query parse error:\n\n')),
            getCodeFrame(q, 1, false, error?.location),
            '\n',
          )
        }

        print(red(bold('Error:')), error?.text, '\n')
      }

      if (hints.length > 0) {
        const preparedText = prepareHintText(hints[0])
        print(blue(bold('Hint:')), preparedText, '\n')
      }
    })

    process.exit(1)
  }

  let spinner = ora(`Getting files list `).start()
  let filePaths = [] as string[]

  try {
    filePaths = await getFilesList({
      searchRoot: resolvedRoot,
      entryPoint: entry,
      byGitChanges: git,
      omitGitIgnore,
      extensionTester: allExtensions ? /\.(\w)+$/ : undefined,
    })
  } catch (e: any) {
    print('\n')
    print(bold(red('Error while getting files list:')))
    print(e.message)
    process.exit(1)
  }

  spinner.stop()
  spinner = ora(`Searching `).start()
  const { matches, errors } = await searchMultiThread({
    mode,
    filePaths,
    caseInsensitive,
    queryCodes: queries,
  })

  spinner.stop()

  const endTime = Date.now()

  if (matches.length > 0) {
    const groupedMatches = Object.entries(groupMatchesByFile(matches))
    const resultsText =
      matches.length <= resultsLimitCount
        ? `Results:\n`
        : `First ${resultsLimitCount} results:\n`

    print(cyan(bold(resultsText)))

    let printedResultsCounter = 0
    let currentFileIndex = 0

    while (
      printedResultsCounter < resultsLimitCount &&
      groupedMatches[currentFileIndex] !== undefined
    ) {
      const [filePath, matches] = groupedMatches[currentFileIndex]
      const relativePath =
        root === process.cwd()
          ? path.relative(resolvedRoot, filePath)
          : filePath

      const maxRelativePathDisplayLength = cols - 4
      const shortenRelativePath = textEllipsis(
        relativePath,
        maxRelativePathDisplayLength,
      )

      const leftPaddingForCentering = Math.trunc(
        (cols - shortenRelativePath.length - 4) / 2,
      )
      const leftPaddingStr = ''.padStart(leftPaddingForCentering, ' ')

      print(
        ''.padStart(leftPaddingForCentering, '━') +
          '┯'.padEnd(shortenRelativePath.length + 3, '━') +
          '┯' +
          ''.padEnd(
            cols - (leftPaddingForCentering + shortenRelativePath.length + 4),
            '━',
          ),
      )

      print(leftPaddingStr + '│ ' + bold(green(shortenRelativePath)) + ' │')

      print(
        leftPaddingStr + '╰'.padEnd(shortenRelativePath.length + 3, '─') + '╯',
      )

      print('')

      for (const match of matches) {
        if (printedResultsCounter >= resultsLimitCount) {
          break
        }

        const resultCode = match.extendedCodeFrame
          ? match.extendedCodeFrame.code
          : match.code
        const matchStartLine = match.loc.start.line
        const codeFrameStartLine = match.extendedCodeFrame
          ? match.extendedCodeFrame.startLine
          : matchStartLine

        const codeFrame = getCodeFrame(resultCode, codeFrameStartLine)

        print(
          `${green(relativePath)}:${magenta(matchStartLine)}:${yellow(
            match.loc.start.column + 1,
          )}`,
        )

        print('\n' + codeFrame + '\n')
        printedResultsCounter++
      }

      currentFileIndex++
    }

    print(separator)
    print('')

    print(cyan(bold('Total count:')), magenta(matches.length))
  } else {
    print(cyan(bold(`No results found${invertExitCode ? '!' : ' :c'}`)))
  }

  queryParseResults.forEach(({ hints }, queryIndex) => {
    hints.forEach((hint, hintIndex) => {
      if (queryIndex === 0 && hintIndex === 0) {
        print('') // new line
      }

      print(blue(bold('Hint:')), prepareHintText(hint), '\n')
    })
  })

  print(cyan(bold('Found in:')), magenta((endTime - startTime) / 1000), 's')
  print(cyan(bold('Searched files:')), magenta(filePaths.length))

  if (errors.length > 0) {
    print(red(bold('Search failed for:')), magenta(errors.length), 'file(s)')
  }

  if (printFilesList) {
    filePaths.forEach((filePath) => print(green(path.relative(root, filePath))))
  }

  print('') // new line

  if (shouldOpenEditor) {
    const shouldStartNextSearch = await waitForSearchDecision()

    if (shouldStartNextSearch) {
      await search(params)
    }
  } else {
    const hasMatches = matches.length > 0
    const shouldFail = hasMatches === invertExitCode
    process.exit(shouldFail ? 1 : 0)
  }
}
