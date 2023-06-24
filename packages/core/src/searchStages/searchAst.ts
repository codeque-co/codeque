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
import { useTraverseApproachTestOnly } from '../testOnlyConfig'
import { getLocationOfMultilineMatch } from './getLocationOfMultilineMatch'
import { MatchContextAliases } from '../matchContext'

export type SearchAstSettings = SearchSettings & {
  queries: NotNullParsedQuery[]
  getCodeForFileNode: (node: PoorNodeType) => string
}

export const searchAst = (
  fileNode: PoorNodeType,
  { queries, getCodeForFileNode, ...settings }: SearchAstSettings,
  unwrapFileNode = true,
  initialContext?: MatchContextAliases,
) => {
  const allMatches: { query: NotNullParsedQuery; matches: Match[] }[] = []
  const nodeToSearch = unwrapFileNode
    ? settings.parserSettings.getProgramNodeFromRootNode(fileNode)
    : fileNode

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

    const matches = traverseAndMatchFn(
      nodeToSearch,
      queryNode,
      newSettings,
      initialContext,
    ).map((match) => {
      if (!isMultistatement) {
        return match
      }

      /**
       * For multi-statement queries we search where exactly statements are located within parent node
       */
      return getLocationOfMultilineMatch(
        match,
        queryNode,
        newSettings,
        traverseAndMatchFn,
      )
    })

    allMatches.push({
      query,
      matches,
    })
  }

  return allMatches
}
