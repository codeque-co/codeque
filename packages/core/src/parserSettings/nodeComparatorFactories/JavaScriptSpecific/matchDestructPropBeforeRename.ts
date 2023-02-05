import { NodesComparator, PoorNodeType } from '../../../types'

/*
 * Support for matching object properties in destructuring before re-assignment
 * Q: const { node } = useForm(); C: const { node: someNode } = useForm()
 */
export const createMatchDestructPropBeforeRenameNodesComparator =
  ({
    objectPropertyNodeName,
  }: {
    objectPropertyNodeName: string
  }): NodesComparator =>
  (
    { queryNode, fileNode, searchSettings: { mode } },
    _,
    { fileKeysToTraverseForOtherMatches, queryKeysMapper, fileKeysMapper },
  ) => {
    const isExact = mode === 'exact'

    if (queryNode && fileNode) {
      if (
        !isExact &&
        // Both are Property
        (queryNode.type as string) === objectPropertyNodeName &&
        (fileNode.type as string) === objectPropertyNodeName &&
        // Both has same key identifier
        (queryNode.key as PoorNodeType).type === 'Identifier' &&
        (fileNode.key as PoorNodeType).type === 'Identifier' &&
        (queryNode.key as PoorNodeType).name ===
          (fileNode.key as PoorNodeType).name &&
        // Both has different value identifier
        (queryNode.value as PoorNodeType).type === 'Identifier' &&
        (fileNode.value as PoorNodeType).type === 'Identifier' &&
        (queryNode.value as PoorNodeType).name !==
          (fileNode.value as PoorNodeType).name
      ) {
        // We skip comparing value if query does not have re-assignment
        const keysToTraverse = ['key']

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
