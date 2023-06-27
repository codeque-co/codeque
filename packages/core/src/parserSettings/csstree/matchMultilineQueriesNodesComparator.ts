import { NodesComparator } from '../../types'

/*
 * Support performing multiline html queries by changing query Program node into ElementNode
 */
export const matchWildcardsInPropValueNodesComparator: NodesComparator = (
  { queryNode, fileNode },
  _,
  { fileKeysToTraverseForOtherMatches },
) => {
  if (queryNode?.type === 'Program' && fileNode?.type === 'Element$1') {
    return {
      levelMatch: true, // we are not interested in other fields than children of both
      queryKeysToTraverseForValidatingMatch: ['templateNodes'],
      fileKeysToTraverseForValidatingMatch: ['children'],
      fileKeysToTraverseForOtherMatches,
    }
  }
}
