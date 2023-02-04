import { NodesComparator } from '../../../types'

/**
 * Support for further processing of function argument or variable declaration with type annotation
 * to support matching the type annotation with wildcard
 *
 * Q: $$SomeType
 * C: const a:MySomeType = {}
 * C: function(a:MySomeType) {}
 */
export const createFurtherProcessingOfTypeWildcardsInIdentifiersNodesComparator =

    (): NodesComparator =>
    (
      { fileNode, queryNode, searchSettings: { logger } },
      _,
      { fileKeysToTraverseForOtherMatches, measureCompare },
    ) => {
      if (fileNode && queryNode) {
        if (queryNode.type === 'Identifier' && fileNode.type === 'Identifier') {
          if (
            queryNode.name !== fileNode.name &&
            fileNode.typeAnnotation !== undefined
          ) {
            logger.log(
              'compare: Identifiers with different names, file type prop',
              fileNode.typeAnnotation,
            )

            logger.log(
              'compare: Identifiers with different names, fileKeysToTraverse',
              fileKeysToTraverseForOtherMatches,
            )

            return {
              levelMatch: false,
              fileKeysToTraverseForValidatingMatch: [],
              queryKeysToTraverseForValidatingMatch: [],
              fileKeysToTraverseForOtherMatches,
            }
          }
        }
      }
    }
