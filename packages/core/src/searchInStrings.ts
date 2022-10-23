import { measureStart } from './utils'
import { parseQueries } from './parseQuery'
import { dedupMatches, SearchSettings, searchFileContent } from './searchStages'
import { textSearch } from './textSearch'
import { createLogger } from './logger'
import { FileSystemSearchArgs, Matches } from './types'
import { SearchResults } from './types'

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
        queries,
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
