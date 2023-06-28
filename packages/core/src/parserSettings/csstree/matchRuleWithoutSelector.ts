import { NodesComparator, PoorNodeType } from '../../types'

/*
 * Skip comparing `prelude` for rules where prelude is empty 'Raw'
 * Q: {background-color: red} C: p {background-color: red}
 */
export const matchRuleWithoutSelector: NodesComparator = (
  { queryNode, fileNode },
  _,
  { fileKeysToTraverseForOtherMatches },
) => {
  if (
    queryNode?.type === 'Rule' &&
    fileNode?.type === 'Rule' &&
    (queryNode?.prelude as PoorNodeType)?.type === 'Raw' &&
    (queryNode?.prelude as PoorNodeType)?.value === ''
  ) {
    return {
      levelMatch: true,
      queryKeysToTraverseForValidatingMatch: ['block'],
      fileKeysToTraverseForValidatingMatch: ['block'],
      fileKeysToTraverseForOtherMatches,
    }
  }
}
