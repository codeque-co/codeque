import { NodesComparator, WildcardUtils, PoorNodeType } from '../../../types'

/**
 * Support for $$$ wildcards for any type annotation
 * in "const a: $$$; const a: () => $$$" treat $$$ as wildcard for any type annotation
 * also type T = $$$
 */
export const createWildcardForAnyTypeAnnotationNodesComparator =
  ({ wildcardUtils }: { wildcardUtils: WildcardUtils }): NodesComparator =>
  ({ queryNode }, _, { fileKeysToTraverseForOtherMatches, measureCompare }) => {
    if (queryNode) {
      if (
        (queryNode.type as string) === 'TSTypeReference' &&
        wildcardUtils.removeIdentifierRefFromWildcard(
          (queryNode.typeName as PoorNodeType).name as string,
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
