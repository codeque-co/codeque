import { NodesComparator } from '../../../types'

/**
 * Support for matching JSXIdentifier using Identifier in query
 * Q: $$T; C: <SomeT /> // without brackets
 */
export const createMatchJsxIdentifierUsingIdentifierNodesComparator =
  (): NodesComparator =>
  (
    { fileNode, queryNode },
    _,
    { fileKeysToTraverseForOtherMatches, measureCompare },
  ) => {
    if (queryNode && fileNode) {
      if (
        (queryNode.type as string) === 'Identifier' &&
        (fileNode.type as string) === 'JSXIdentifier' &&
        queryNode.name === fileNode.name
      ) {
        return {
          levelMatch: true,
          queryKeysToTraverseForValidatingMatch: [],
          fileKeysToTraverseForValidatingMatch: [],
          fileKeysToTraverseForOtherMatches,
        }
      }
    }
  }
