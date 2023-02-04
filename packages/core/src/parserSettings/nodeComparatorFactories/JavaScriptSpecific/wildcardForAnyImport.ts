import { NodesComparator, PoorNodeType, WildcardUtils } from '../../../types'

/**
 * Treat "import $$$ from '...'" as wildcard for any import
 * */
export const createWildcardForAnyImportNodesComparator =
  ({ wildcardUtils }: { wildcardUtils: WildcardUtils }): NodesComparator =>
  ({ queryNode }, _, { fileKeysToTraverseForOtherMatches, measureCompare }) => {
    if (queryNode) {
      if (
        (queryNode.type as string) === 'ImportDefaultSpecifier' &&
        (queryNode.local as PoorNodeType).name ===
          wildcardUtils.nodesTreeWildcard
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
