import { NodesComparator, WildcardUtils } from '../../../types'

export const createWildcardForTypeKeywordNodesComparator =
  ({ wildcardUtils }: { wildcardUtils: WildcardUtils }): NodesComparator =>
  (
    { fileNode, queryNode },
    _,
    { fileKeysToTraverseForOtherMatches, measureCompare },
  ) => {
    if (fileNode && queryNode) {
      // TS family specific,can be parametrized and reused
      /*
       * support using '$$' wildcard for TS keywords like 'never', 'boolean' etc.
       * Since actual wildcard char is child of TSTypeReference (typeName), we have to hop one level deeper
       * otherwise level comparison will not work
       */
      if (
        (fileNode.type as string).includes('TS') &&
        (fileNode.type as string).includes('Keyword') &&
        (queryNode.type as string) === 'TSTypeReference' &&
        ((queryNode.typeName as any).name as string) ===
          wildcardUtils.identifierWildcard &&
        (queryNode.typeParameters as any) === undefined
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
