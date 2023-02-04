import { measureStart, dedupMatches } from './utils'
import { parseQueries } from './parseQuery'
import { searchFileContent } from './searchStages/searchFileContent'
import { textSearch } from './textSearch'
import { createLogger } from './logger'
import {
  FileSystemSearchArgs,
  Matches,
  SearchResults,
  NotNullParsedQuery,
  SearchSettings,
  ParserType,
} from './types'
import { parserSettingsMap } from './parserSettings/index'

const testParserTypeOverride = process?.env?.TEST_PARSER_TYPE as ParserType

type StringsSearchArgs = Omit<FileSystemSearchArgs, 'filePaths'> & {
  files: {
    content: string
    path: string
  }[]
}

export const searchInStrings = ({
  queryCodes,
  files,
  mode,
  debug = false,
  caseInsensitive = false,
  parser = 'babel',
}: StringsSearchArgs): SearchResults => {
  if (mode === 'text') {
    const getFileContent = (filePath: string) => {
      return files.find((file) => file.path === filePath)?.content as string
    }

    return textSearch({
      getFileContent,
      filePaths: files.map((file) => file.path),
      mode,
      queryCodes,
      caseInsensitive,
    })
  }

  const parserSettings = parserSettingsMap[testParserTypeOverride ?? parser]

  const settings: SearchSettings = {
    mode,
    caseInsensitive,
    logger: createLogger(debug),
    parserSettings,
  }

  const { log } = settings.logger

  const allMatches: Matches = []
  log('Parse query')
  const measureParseQuery = measureStart('parseQuery')

  const [queries, parseOk] = parseQueries(
    queryCodes,
    caseInsensitive,
    parserSettings,
  )

  if (!parseOk) {
    return {
      matches: [],
      errors: queries.filter((queryResult) => queryResult.error),
      hints: queries.map(({ hints }) => hints),
    }
  }

  const searchErrors = []
  measureParseQuery()

  log(
    'inputQueryNode',
    queries.map(({ queryNode }) => queryNode),
  )

  for (const file of files) {
    try {
      const fileMatches = searchFileContent({
        queries: queries as NotNullParsedQuery[],
        filePath: file.path,
        fileContent: file.content,
        ...settings,
      })

      allMatches.push(...fileMatches)

      if (fileMatches.length > 0) {
        log(file.path, 'matches', fileMatches)

        if (debug) {
          break
        }
      }
    } catch (e) {
      searchErrors.push((e as Error).message)

      if (debug) {
        console.error(file.path, e)
        break
      }
    }
  }

  return {
    matches: dedupMatches(allMatches, log, debug),
    errors: searchErrors,
    hints: queries.map(({ hints }) => hints),
  }
}

export default searchInStrings
