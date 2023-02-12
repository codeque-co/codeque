import {
  PoorNodeType,
  NotNullParsedQuery,
  SearchSettings,
  Match,
} from '../types'
import {
  traverseAndMatch,
  test_traverseAndMatchWithVisitors,
} from './traverseAndMatch'
import { useTraverseApproachTestOnly } from '../config'

export type SearchAstSettings = SearchSettings & {
  queries: NotNullParsedQuery[]
  getCodeForFileNode?: (node: PoorNodeType) => string
}

export const searchAst = (
  fileNode: PoorNodeType,
  { queries, getCodeForFileNode, ...settings }: SearchAstSettings,
) => {
  const allMatches: { query: NotNullParsedQuery; matches: Match[] }[] = []
  const programNode =
    settings.parserSettings.getProgramNodeFromRootNode(fileNode)

  for (const query of queries) {
    const { queryNode, isMultistatement, queryCode } = query

    const getCodeForNode = (node: PoorNodeType, nodeType: 'query' | 'file') => {
      if (!node) {
        return 'undefined Node'
      }

      if (nodeType === 'file') {
        return getCodeForFileNode?.(node) ?? ''
      }

      try {
        const pos = settings.parserSettings.getNodePosition(node)

        return queryCode.substring(pos.start, pos.end)
      } catch {
        console.log('Failed getting position for node', node)
      }

      return ''
    }

    const newSettings = {
      ...settings,
      getCodeForNode,
    }

    const traverseAndMatchFn = useTraverseApproachTestOnly
      ? test_traverseAndMatchWithVisitors
      : traverseAndMatch

    const matches = traverseAndMatchFn(programNode, queryNode, newSettings).map(
      (match) => {
        if (!isMultistatement) {
          return match
        }
        /**
         * TODO: Try to get rid of this somehow
         */

        /**
         * For multi-statement queries we search where exactly statements are located within parent node
         */

        const { blockNodeBodyKey } =
          settings.parserSettings.programNodeAndBlockNodeUtils

        const statements = queryNode[blockNodeBodyKey] as PoorNodeType[]

        const subMatches = statements
          .map((statement) =>
            traverseAndMatchFn(match.node, statement, newSettings),
          )
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
