import { Matches, NotNullParsedQuery, SearchSettings } from '../types'
import { getExtendedCodeFrame, measureStart, prepareCodeResult } from '../utils'
import { searchAst } from './searchAst'
import { shallowSearch } from './shallowSearch'

type SearchFileContentArgs = SearchSettings & {
  queries: NotNullParsedQuery[]
  filePath: string
  fileContent: string
}

export const searchFileContent = ({
  queries,
  fileContent,
  filePath,
  ...settings
}: SearchFileContentArgs) => {
  const shallowSearchPassed = shallowSearch({
    queries,
    fileContent,
    ...settings,
  })

  let allMatches: Matches = []

  if (shallowSearchPassed) {
    const measureParseFile = measureStart('parseFile')

    const fileNode = settings.parserSettings.parseCode(fileContent, filePath)

    measureParseFile()
    const measureSearch = measureStart('search')

    const results = searchAst(fileNode, { queries, ...settings })

    allMatches = results
      .map(({ query, matches }) => {
        return matches.map((match) => {
          const code = prepareCodeResult({ fileContent, ...match })
          const [extendedCodeFrame, newStartLine] = getExtendedCodeFrame(
            match,
            fileContent,
          )

          return {
            filePath,
            ...match,
            query: query.queryCode,
            code,
            extendedCodeFrame: {
              code: extendedCodeFrame,
              startLine: match.loc.start.line + newStartLine,
            },
          }
        })
      })
      .flat(1)

    measureSearch()
  }

  return allMatches
}
