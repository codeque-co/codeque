import { NodesComparator } from '../../../types'
/**
 *
 * Support for matching JSXElements without children regardless closing/opening tag
 * Q: <$$/>; C: <Some />; C: <Some></Some>
 * Q: <$$></$$>; C: <Some />; C: <Some></Some>
 */
export const createMatchJsxElementRegardlessClosingTagNodesComparator =
  (): NodesComparator =>
  (
    { fileNode, queryNode, searchSettings: { mode } },
    _,
    {
      fileKeysToTraverseForOtherMatches,
      measureCompare,
      queryKeysMapper,
      fileKeysMapper,
    },
  ) => {
    const isExact = mode === 'exact'

    if (queryNode && fileNode) {
      if (
        !isExact &&
        (queryNode.type as string) === 'JSXElement' &&
        (fileNode.type as string) === 'JSXElement' &&
        (queryNode.children as []).length === 0
      ) {
        measureCompare()

        // To skip matching closing element
        const keysToTraverse = ['openingElement']

        return {
          levelMatch: true,
          queryKeysToTraverseForValidatingMatch:
            keysToTraverse.map(queryKeysMapper),
          fileKeysToTraverseForValidatingMatch:
            keysToTraverse.map(fileKeysMapper),
          fileKeysToTraverseForOtherMatches,
        }
      }

      /**
       * 2/2 Support for matching JSXElements without children regardless closing/opening tag
       * TODO: code example
       *
       */
      if (
        !isExact &&
        (queryNode.type as string) === 'JSXOpeningElement' &&
        (fileNode.type as string) === 'JSXOpeningElement'
      ) {
        measureCompare()
        const keysToTraverse = ['name', 'attributes']

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
