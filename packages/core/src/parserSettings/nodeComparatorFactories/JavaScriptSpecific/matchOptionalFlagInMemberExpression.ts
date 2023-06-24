import { NodesComparator, PoorNodeType } from '../../../types'

/**
 *
 * This is probably ipml only for babel, other estree parsers will have common impl
 * - Move this to babel dir
 * - change this impl to be compliant with estree (check other estree ASTs)
 * - do it at the end, as nested nodes matching is tricky and risky
 */

/*
 * Support for matching optional flag in MemberExpressions
 * Q: path?.to?.obj, C: path.to.obj
 * Q: path.to.obj, C: path?.to?.obj
 */
export const createMatchOptionalFlagInMemberExpressionNodesComparator =
  (): NodesComparator =>
  (
    { queryNode, fileNode, searchSettings, matchContext },
    compareNodes,
    { fileKeysToTraverseForOtherMatches, queryKeysMapper, fileKeysMapper },
  ) => {
    const isExact = searchSettings.mode === 'exact'

    if (queryNode && fileNode && !isExact) {
      const memberExpressionsNodeTypes = [
        'MemberExpression',
        'OptionalMemberExpression', // babel only, keep here for now
      ]

      if (
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
            keysToTraverseForValidatingMatch.map(queryKeysMapper),
          fileKeysToTraverseForValidatingMatch:
            keysToTraverseForValidatingMatch.map(fileKeysMapper),
          fileKeysToTraverseForOtherMatches,
        }
      } else if (
        memberExpressionsNodeTypes.includes(queryNode.type as string) &&
        fileNode.type === 'ChainExpression'
      ) {
        return compareNodes({
          fileNode: fileNode.expression as PoorNodeType,
          queryNode,
          searchSettings,
          queryKeysPrefix: queryKeysMapper(''),
          fileKeysPrefix: fileKeysMapper('expression'),
          matchContext,
        })
      } else if (
        queryNode.type === 'ChainExpression' &&
        memberExpressionsNodeTypes.includes(fileNode.type as string)
      ) {
        return compareNodes({
          fileNode,
          queryNode: queryNode.expression as PoorNodeType,
          searchSettings,
          queryKeysPrefix: queryKeysMapper('expression'),
          fileKeysPrefix: fileKeysMapper(''),
          matchContext,
        })
      }
    }
  }
