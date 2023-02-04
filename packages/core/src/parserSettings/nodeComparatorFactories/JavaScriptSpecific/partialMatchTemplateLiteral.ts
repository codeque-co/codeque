import { NodesComparator } from '../../../types'

/*
 * Support for partial matching of template literals
 * Q: `${val}text`; C: `${bar}blabla${val}text${baz}`
 */

export const createPartialMatchTemplateLiteralNodesComparator =
  (): NodesComparator =>
  (
    { queryNode, fileNode, searchSettings: { mode } },
    _,
    { fileKeysToTraverseForOtherMatches, measureCompare },
  ) => {
    const isExact = mode === 'exact'

    if (queryNode && fileNode) {
      if (
        !isExact &&
        (queryNode.type as string) === 'TemplateElement' &&
        (fileNode.type as string) === 'TemplateElement' &&
        (queryNode.value as { raw?: string })?.raw?.length === 0
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
