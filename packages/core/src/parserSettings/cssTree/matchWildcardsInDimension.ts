import { NodesComparator, PoorNodeType } from '../../types'
import { matchStringOrIdentifierAliases } from '../../searchStages/matchStringOrIdentifierAliases'

/*
 * Adds support for matching wildcard in "Dimension" unit and value
 * Q: {width: 0x0px} C: {width: 5px}
 * Q: {width: 5$$}   C: {width: 5px}
 * Q: {width: 0x0$$} C: {width: 5px}
 */
export const matchWildcardsInDimension: NodesComparator = (
  { queryNode, fileNode, searchSettings, matchContext },
  _,
  { fileKeysToTraverseForOtherMatches, log },
) => {
  if (queryNode?.type === 'Dimension' && fileNode?.type === 'Dimension') {
    log(
      'Compare dimension nodes',
      queryNode.value as string,
      queryNode.unit as string,
      fileNode.value as string,
      fileNode.unit as string,
    )

    const { wildcardUtils } = searchSettings.parserSettings
    const { caseInsensitive } = searchSettings

    let levelMatch = true

    const queryNodeStringContent = queryNode.unit as string

    const fileNodeStringContent = fileNode.unit as string

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

    /**
     * Compare values only if there is no numeric wildcard in query
     */
    if (queryNode.value !== wildcardUtils.numericWildcard) {
      levelMatch = levelMatch && queryNode.value === fileNode.value
    }

    // We always want to return here, otherwise generic string wildcard matching would take over and match incorrectly
    return {
      levelMatch,
      queryKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForOtherMatches,
    }
  }
}
