import {
  Matches,
  NotNullParsedQuery,
  PoorNodeType,
  SearchSettings,
} from '../types'
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
  const {
    logger: { log },
  } = settings
  log('searchFileContent')
  const shallowSearchPassed = shallowSearch({
    queries,
    fileContent,
    ...settings,
  })

  log('searchFileContent', 'shallowSearchPassed', shallowSearchPassed)

  let allMatches: Matches = []

  if (shallowSearchPassed) {
    const measureParseFile = measureStart('parseFile')

    const getCodeForFileNode = (node: PoorNodeType) => {
      const pos = settings.parserSettings.getNodePosition(node)

      return fileContent.substring(pos.start, pos.end)
    }

    const fileNode = settings.parserSettings.parseCode(fileContent, filePath)

    measureParseFile()
    const measureSearch = measureStart('search')

    const results = searchAst(fileNode, {
      queries,
      getCodeForFileNode,
      ...settings,
    })

    allMatches = results
      .map(({ query, matches }) => {
        return matches.map(({ node, ...match }) => {
          const { code, indentationBase } = prepareCodeResult({
            fileContent,
            ...match,
          })

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
            indentationBase,
          }
        })
      })
      .flat(1)

    measureSearch()
  }

  return allMatches
}
