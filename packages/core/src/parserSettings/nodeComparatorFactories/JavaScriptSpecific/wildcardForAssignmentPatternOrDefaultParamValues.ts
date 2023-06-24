import { NodesComparator, PoorNodeType } from '../../../types'

/**
 * Support for matching function params with default value or object/array destructuring with default value
 *
 * Since we comparing query node with nested node from file, we have to do so before wildcards comparison
 *
 * Q: const {$$} = query; C: const {data = []} = query
 * Q: const [$$] = query; C: const [data = []] = query
 * Q: function some($$) {}; C: function some(param = null) {}
 */
export const createWildcardForAssignmentPatternOrDefaultParamValuesNodesComparator =

    (): NodesComparator =>
    (
      { fileNode, queryNode, searchSettings, matchContext },
      compareNodes,
      { queryKeysMapper, fileKeysMapper },
    ) => {
      const { mode, logger } = searchSettings
      const isExact = mode === 'exact'

      if (queryNode && fileNode) {
        if (
          !isExact &&
          (queryNode.type as string) === 'Identifier' &&
          (fileNode.type as string) === 'AssignmentPattern' &&
          (fileNode.left as PoorNodeType)?.type === 'Identifier'
        ) {
          logger.log('comparing assignment pattern with identifier')

          // By comparing nodes this way, we support wildcards in compared identifiers
          return compareNodes({
            fileNode: fileNode.left as PoorNodeType,
            queryNode,
            searchSettings,
            queryKeysPrefix: queryKeysMapper(''),
            fileKeysPrefix: fileKeysMapper('left'),
            matchContext,
          })
        }
      }
    }
