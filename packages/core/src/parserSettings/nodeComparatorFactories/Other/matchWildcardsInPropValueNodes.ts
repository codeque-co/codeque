import { NodesComparator } from '../../../types'
import { matchStringOrIdentifierAliases } from '../../../searchStages/matchStringOrIdentifierAliases'

type Settings = {
  nodeType: string
  keysWithWildcards: string[]
  keysToTraverse: string[]
}
/*
 * Supports matching string or identifier wildcards in nodes that contains prop and value in the same node.
 * eg. TextAttribute in HTML which is { prop: 'propName', value: 'value', ...otherKeys }
 */
export const createMatchWildcardsInPropValueNodesComparator =
  ({
    nodeType,
    keysWithWildcards,
    keysToTraverse,
  }: Settings): NodesComparator =>
  (
    { queryNode, fileNode, searchSettings, matchContext },
    _,
    { fileKeysToTraverseForOtherMatches },
  ) => {
    if (queryNode?.type === nodeType && fileNode?.type === nodeType) {
      const { wildcardUtils } = searchSettings.parserSettings
      const { caseInsensitive } = searchSettings

      let levelMatch = true

      keysWithWildcards.forEach((key) => {
        const queryNodeStringContent = queryNode[key] as string

        const fileNodeStringContent = fileNode[key] as string

        const wildcardsMeta = wildcardUtils.getStringWildcardsFromString(
          queryNodeStringContent,
        )

        if (wildcardsMeta.length > 0) {
          levelMatch =
            levelMatch &&
            matchStringOrIdentifierAliases({
              queryValue: queryNodeStringContent,
              fileValue: fileNodeStringContent,
              wildcardsMeta,
              matchContext,
              wildcardUtils,
              caseInsensitive,
            })
        } else {
          /**
           * If there are no wildcards in given prop, compare prop values directly
           */
          levelMatch =
            levelMatch && queryNodeStringContent === fileNodeStringContent
        }
      })

      // We always want to return here, otherwise generic string wildcard matching would take over and match incorrectly
      return {
        levelMatch,
        queryKeysToTraverseForValidatingMatch: keysToTraverse,
        fileKeysToTraverseForValidatingMatch: keysToTraverse,
        fileKeysToTraverseForOtherMatches,
      }
    }
  }
