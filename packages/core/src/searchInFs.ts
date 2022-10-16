import fs from 'fs'
import { measureStart, logMetrics } from './utils'
import { createLogger } from './logger'
import { parseQueries } from './parseQuery'
import { searchFileContent, SearchSettings, dedupMatches } from './searchStages'
import { FileSystemSearchArgs, Matches, SearchResults } from './types'
import { textSearch } from './textSearch'

export const searchInFileSystem = ({
  mode,
  filePaths,
  queryCodes,
  caseInsensitive = false,
  debug = false,
  onPartialResult,
  maxResultsLimit,
}: FileSystemSearchArgs): SearchResults => {
  if (mode === 'text') {
    const getFileContent = (filePath: string) => {
      // sync file getting works faster :man-shrug; in text mode
      return fs.readFileSync(filePath).toString()
    }

    return textSearch({
      getFileContent,
      filePaths,
      mode,
      queryCodes,
      caseInsensitive,
      onPartialResult,
      maxResultsLimit,
    })
  }

  const settings: SearchSettings = {
    mode,
    caseInsensitive,
    logger: createLogger(debug),
  }

  const { log } = settings.logger

  const allMatches: Matches = []
  log('Parse query')
  const measureParseQuery = measureStart('parseQuery')

  const [queries, parseOk] = parseQueries(queryCodes, caseInsensitive)

  if (!parseOk) {
    return {
      matches: [],
      hints: queries.map(({ hints }) => hints),
      errors: queries.filter((queryResult) => queryResult.error),
    }
  }

  const searchErrors = []
  measureParseQuery()

  log(
    'inputQueryNode',
    queries.map(({ queryNode }) => queryNode),
  )

  for (const filePath of filePaths) {
    if (maxResultsLimit !== undefined && allMatches.length > maxResultsLimit) {
      break
    }

    try {
      log('Parse file')
      const measureReadFile = measureStart('readFile')

      const fileContent = fs.readFileSync(filePath).toString()
      measureReadFile()

      const fileMatches = searchFileContent({
        queries,
        filePath,
        fileContent,
        ...settings,
      })
      const dedupedFileMatches = dedupMatches(fileMatches, log, debug)

      if (onPartialResult && dedupedFileMatches.length > 0) {
        onPartialResult(dedupedFileMatches)
      }

      allMatches.push(...dedupedFileMatches)

      if (dedupedFileMatches.length > 0) {
        log(filePath, 'matches', dedupedFileMatches)

        if (debug) {
          break
        }
      }
    } catch (e) {
      searchErrors.push(e)

      if (debug) {
        console.error(filePath, e)
        break
      }
    }
  }

  return {
    matches: allMatches,
    errors: searchErrors,
    hints: queries.map(({ hints }) => hints),
  }
}
