import { PoorNodeType, NodesComparator } from '../../../types'
import { wildcardUtils } from '../common'
export const wildcardForAnyTypeParameter: NodesComparator = (
  { queryNode },
  _,
  { fileKeysToTraverseForOtherMatches, measureCompare },
) => {
  if (queryNode) {
    if (
      (queryNode.type as string) === 'TSTypeParameter' &&
      wildcardUtils.removeIdentifierRefFromWildcard(
        (queryNode.name as PoorNodeType).name as string,
      ) === wildcardUtils.nodesTreeWildcard
    ) {
      measureCompare()

      return {
        levelMatch: true,
        queryKeysToTraverseForValidatingMatch: [],
        fileKeysToTraverseForValidatingMatch: [],
        fileKeysToTraverseForOtherMatches,
      }
    }
  }
}
