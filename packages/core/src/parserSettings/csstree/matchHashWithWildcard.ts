import { NodesComparator, PoorNodeType } from '../../types'
import { matchStringOrIdentifierAliases } from '../../searchStages/matchStringOrIdentifierAliases'

/*
 * Adds support for matching color Hash with wildcard
 * Q: {color: $$ } C: {color: #000 }
 */
export const matchHashWithWildcard: NodesComparator = (
  { queryNode, fileNode, searchSettings, matchContext },
  _,
  { fileKeysToTraverseForOtherMatches, log },
) => {
  if (queryNode?.type === 'Identifier' && fileNode?.type === 'Hash') {
    log(
      'Compare Identifier with Hash node',
      queryNode.name as string,
      fileNode.value as string,
    )

    const { wildcardUtils } = searchSettings.parserSettings
    const { caseInsensitive } = searchSettings

    const queryNodeStringContent = queryNode.name as string

    const fileNodeStringContent = fileNode.value as string

    const wildcardsMeta = wildcardUtils.getStringWildcardsFromString(
      queryNodeStringContent,
    )

    if (wildcardsMeta.length > 0) {
      const levelMatch = matchStringOrIdentifierAliases({
        queryValue: queryNodeStringContent,
        fileValue: fileNodeStringContent,
        wildcardsMeta,
        matchContext,
        wildcardUtils,
        caseInsensitive,
      })

      if (levelMatch) {
        return {
          levelMatch,
          queryKeysToTraverseForValidatingMatch: [],
          fileKeysToTraverseForValidatingMatch: [],
          fileKeysToTraverseForOtherMatches,
        }
      }
    }
  }
}
