import { NodesComparator, PoorNodeType } from '../../../types'

/**
 * Support for object property strings, identifiers and numbers comparison
 * TODO: code example
 *
 */
export const createMatchObjectPropertiesOfDifferentTypesNodesComparator =
  (): NodesComparator =>
  (
    { queryNode, fileNode, searchSettings: { mode } },
    _,
    {
      fileKeysToTraverseForOtherMatches,
      queryKeysMapper,
      fileKeysMapper,
      measureCompare,
    },
  ) => {
    const isExact = mode === 'exact'

    if (queryNode && fileNode) {
      if (
        !isExact &&
        (queryNode.type as string) === 'ObjectProperty' &&
        (fileNode.type as string) === 'ObjectProperty' &&
        !(queryNode.method as boolean) &&
        !(fileNode.method as boolean)
      ) {
        // Key can be Identifier with `name` or String/Number with `value`
        const queryKeyValue =
          (queryNode.key as PoorNodeType).name ||
          (queryNode.key as PoorNodeType).value

        const fileKeyValue =
          (fileNode.key as PoorNodeType).name ||
          (fileNode.key as PoorNodeType).value

        // compare with == to automatically cast types
        if (queryKeyValue == fileKeyValue) {
          measureCompare()

          const keysToTraverse = ['value']

          return {
            levelMatch: true,
            queryKeysToTraverseForValidatingMatch:
              keysToTraverse.map(queryKeysMapper),
            fileKeysToTraverseForValidatingMatch:
              keysToTraverse.map(fileKeysMapper),
            fileKeysToTraverseForOtherMatches,
          }
        }
      }
    }
  }
