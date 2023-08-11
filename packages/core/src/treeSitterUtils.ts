import type { SyntaxNode, Tree } from 'web-tree-sitter'
import { PoorNodeType, TreeSitterNodeFieldsMeta } from './types'

export function collectAstFromTree(
  tree: Tree,
  codeText: string,
  defineRawValueForNodeTypes: string[],
  nodeFieldsMeta: TreeSitterNodeFieldsMeta,
) {
  const getPosition = (node: SyntaxNode) => {
    const startPosition = node.startPosition
    const endPosition = node.endPosition
    const startIndex = node.startIndex
    const endIndex = node.endIndex

    return {
      start: {
        line: startPosition.row + 1,
        column: startPosition.column,
        index: startIndex,
      },
      end: {
        line: endPosition.row + 1,
        column: endPosition.column,
        index: endIndex,
      },
    }
  }

  function collectAstFromTreeInner(
    node: SyntaxNode,
    level = 0,
    nodeTypeFromParent?: string,
  ) {
    /**
     * Receiving node type from parent is performance optimization for slow access to WASM memory
     */
    const nodeType = nodeTypeFromParent ?? node.type

    if (nodeType === 'ERROR') {
      const errorLocation = getPosition(node)
      const error = Error(
        `Parse error at ${errorLocation.start.line}:${errorLocation.start.column}-${errorLocation.end.line}:${errorLocation.end.column}`,
      )

      //@ts-ignore
      error.loc = errorLocation

      throw error
    }

    const nodeMeta = nodeFieldsMeta[nodeType]

    if (!nodeMeta) {
      /**
       * We don't care about node types that are not in meta mapping
       */
      return null
    }

    const fields = Object.fromEntries([
      ...nodeMeta.multipleOrChildrenFieldNames.map((fieldName) => [
        fieldName,
        [],
      ]),
      ...nodeMeta.singleFieldNames.map((fieldName) => [fieldName, null]),
    ])

    const filedNodes: SyntaxNode[] = []

    nodeMeta.singleFieldNames.forEach((fieldName) => {
      const childForName = node.childForFieldName(fieldName)

      if (childForName) {
        filedNodes.push(childForName)

        fields[fieldName] = collectAstFromTreeInner(childForName, level + 1)
      }
    })

    const childCount = node.childCount

    for (let i = 0; i < childCount; i++) {
      const childNode = node.child(i)

      if (
        childNode &&
        !filedNodes.some((fieldNode) => fieldNode.equals(childNode))
      ) {
        const collectedNodeType = childNode.type as string

        if (collectedNodeType === 'ERROR') {
          collectAstFromTreeInner(childNode, level + 1, collectedNodeType)
        }

        /**
         * We ignore nodes with types that are not in mapping
         */
        if (nodeFieldsMeta[collectedNodeType]) {
          const collectedNode = collectAstFromTreeInner(
            childNode,
            level + 1,
            collectedNodeType,
          )

          if (collectedNode) {
            const field =
              nodeMeta.nodeTypeToMultipleFieldName[collectedNodeType]

            if (field) {
              if (fields[field]) {
                fields[field].push(collectedNode)
              } else {
                console.error(`No field "${field}" for ${collectedNodeType}`)
              }
            }

            /**
             * When node field was not found in mapping, it most likely mean that node was some language keyword that can be skipped
             */
          }
        }
      }
    }

    const rawNode = {
      nodeType: nodeType,
      loc: getPosition(node),
      ...fields,
    } as PoorNodeType

    const isLeaf =
      nodeMeta.multipleOrChildrenFieldNames.length === 0 &&
      nodeMeta.singleFieldNames.length === 0

    // Temporary disable check for leaf node, perhaps it's not needed. Now breaks stuff for string_content, which itself needs more adjustments to work properly
    if (/*isLeaf && */ defineRawValueForNodeTypes.includes(nodeType)) {
      rawNode.rawValue = codeText.substring(
        //@ts-ignore
        rawNode.loc.start.index,
        //@ts-ignore
        rawNode.loc.end.index,
      )
    }

    return rawNode
  }

  return collectAstFromTreeInner(tree.rootNode)
}
