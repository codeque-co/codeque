import { NodesComparator, PoorNodeType } from '../../types'
import { matchStringOrIdentifierAliases } from '../../searchStages/matchStringOrIdentifierAliases'

/*
 * Adds support for matching wildcard in "Declaration" property key
 * Q: {background-$$: red} C: p {background-color: red}
 */
export const matchWildcardInDeclarationProperty: NodesComparator = (
  { queryNode, fileNode, searchSettings, matchContext },
  _,
  { fileKeysToTraverseForOtherMatches },
) => {
  if (queryNode?.type === 'Declaration' && fileNode?.type === 'Declaration') {
    const { wildcardUtils } = searchSettings.parserSettings
    const { caseInsensitive, mode } = searchSettings
    const isExact = mode === 'exact'

    // Important modifier is optional for query in include mode
    let levelMatch = isExact
      ? queryNode.important === fileNode.important
      : queryNode.important
      ? Boolean(fileNode.important)
      : true

    const queryNodeStringContent = queryNode.property as string

    const fileNodeStringContent = fileNode.property as string

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

    // We always want to return here, otherwise generic string wildcard matching would take over and match incorrectly
    return {
      levelMatch,
      queryKeysToTraverseForValidatingMatch: ['value'],
      fileKeysToTraverseForValidatingMatch: ['value'],
      fileKeysToTraverseForOtherMatches,
    }
  }
}
