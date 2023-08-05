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

  function collectAstFromTreeInner(node: SyntaxNode, level = 0) {
    const nodeType = node.type
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
        const collectedNode = collectAstFromTreeInner(childNode, level + 1)

        if (collectedNode) {
          const field =
            nodeMeta.nodeTypeToMultipleFieldName[
              collectedNode.nodeType as string
            ]

          if (field) {
            fields[field].push(collectedNode)
          } else {
            throw new Error('Field for node not found.')
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
