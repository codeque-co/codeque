import { NodesComparator } from '../../../types'

/*
 * Support for matching optional flag in MemberExpressions
 * Q: path?.to?.obj, C: path.to.obj
 * Q: path.to.obj, C: path?.to?.obj
 */
export const createMatchOptionalFlagInMemberExpressionNodesComparator =
  (): NodesComparator =>
  (
    { queryNode, fileNode, searchSettings: { mode } },
    _,
    { fileKeysToTraverseForOtherMatches, measureCompare },
  ) => {
    const isExact = mode === 'exact'

    if (queryNode && fileNode) {
      const memberExpressionsNodeTypes = [
        'MemberExpression',
        'OptionalMemberExpression',
      ]

      if (
        !isExact &&
        memberExpressionsNodeTypes.includes(queryNode.type as string) &&
        memberExpressionsNodeTypes.includes(fileNode.type as string) &&
        queryNode.computed === fileNode.computed // this could be also supported in more flexible way
      ) {
        /**
         We skip comparing 'optional' property on the nodes, to match them interchangeably
        */
        const keysToTraverseForValidatingMatch = ['object', 'property']

        return {
          levelMatch: true,
          queryKeysToTraverseForValidatingMatch:
            keysToTraverseForValidatingMatch,
          fileKeysToTraverseForValidatingMatch:
            keysToTraverseForValidatingMatch,
          fileKeysToTraverseForOtherMatches,
        }
      }
    }
  }
