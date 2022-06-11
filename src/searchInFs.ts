import fs from 'fs'
import { measureStart } from '/utils'
import { createLogger } from './logger'
import { parseQueries } from '/parseQuery'
import { searchFileContent, SearchSettings, dedupMatches } from './searchStages'
import { FileSystemSearchArgs, Matches, SearchResults } from './types'
import { textSearch } from '/textSearch'

export const searchInFileSystem = ({
  mode,
  filePaths,
  queryCodes,
  caseInsensitive = false,
  debug = false
}: FileSystemSearchArgs): SearchResults => {
  if (mode === 'text') {
    const getFileContent = (filePath: string) => {
      return fs.readFileSync(filePath).toString()
    }
    return textSearch({
      getFileContent,
      filePaths,
      mode,
      queryCodes,
      caseInsensitive
    })
  }

  const settings: SearchSettings = {
    mode,
    caseInsensitive,
    logger: createLogger(debug)
  }

  const { log } = settings.logger

  const allMatches: Matches = []
  log('Parse query')
  const measureParseQuery = measureStart('parseQuery')

  const [queries, parseOk] = parseQueries(queryCodes, caseInsensitive)

  if (!parseOk) {
    return {
      matches: [],
      errors: queries.filter((queryResult) => queryResult.error)
    }
  }
  const searchErrors = []
  measureParseQuery()

  log(
    'inputQueryNode',
    queries.map(({ queryNode }) => queryNode)
  )

  for (const filePath of filePaths) {
    try {
      log('Parse file')
      const measureReadFile = measureStart('readFile')

      const fileContent = fs.readFileSync(filePath).toString()
      measureReadFile()

      const fileMatches = searchFileContent({
        queries,
        filePath,
        fileContent,
        ...settings
      })

      allMatches.push(...fileMatches)

      if (fileMatches.length > 0) {
        log(filePath, 'matches', fileMatches)
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
    matches: dedupMatches(allMatches, log, debug),
    errors: searchErrors
  }
}
