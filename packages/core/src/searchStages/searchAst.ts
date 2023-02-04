import {
  PoorNodeType,
  NotNullParsedQuery,
  SearchSettings,
  Match,
} from '../types'
import { babelParserSettings } from '../parserSettings'
import { traverseAndMatch } from './traverseAndMatch'

export type SearchAstSettings = SearchSettings & {
  queries: NotNullParsedQuery[]
}

export const searchAst = (
  fileNode: PoorNodeType,
  { queries, ...settings }: SearchAstSettings,
) => {
  const allMatches: { query: NotNullParsedQuery; matches: Match[] }[] = []
  const programNode = babelParserSettings.getProgramNodeFromRootNode(fileNode)

  for (const query of queries) {
    const { queryNode, isMultistatement } = query
    // todo store matches per query
    const matches = traverseAndMatch(programNode, queryNode, settings).map(
      (match) => {
        if (!isMultistatement) {
          return match
        }
        /**
         * For multi-statement queries we search where exactly statements are located within parent node
         */

        const statements = queryNode.body as PoorNodeType[]

        const subMatches = statements
          .map((statement) => traverseAndMatch(match.node, statement, settings))
          .flat()
          .sort((matchA, matchB) => matchA.start - matchB.end)

        const firstSubMatch = subMatches[0]
        const lastSubMatch = subMatches[subMatches.length - 1]

        return {
          start: firstSubMatch.start,
          end: lastSubMatch.end,
          loc: {
            start: firstSubMatch.loc.start,
            end: lastSubMatch.loc.end,
          },
        } as Match
      },
    )

    allMatches.push({
      query,
      matches,
    })
  }

  return allMatches
}
