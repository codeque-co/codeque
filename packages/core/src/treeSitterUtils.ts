import type { SyntaxNode, Tree } from 'web-tree-sitter'
import { PoorNodeType } from './types'

export function collectAstFromTree(
  tree: Tree,
  codeText: string,
  nodeTypeToFieldsCache: Record<string, string[]>,
  defineRawValueForNodeTypes: string[],
) {
  const allFieldNames = (tree.rootNode.tree as any).language.fields as string[]

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

  function collectAstFromTree(node: SyntaxNode, level = 0, fieldName = '') {
    const nodeType = node.type
    const fields = []
    const filedNodes = []

    /**
     * Cache which node has which fields to not check all fields all the time?
     */
    if (nodeTypeToFieldsCache[nodeType]) {
      for (const fieldName of nodeTypeToFieldsCache[nodeType]) {
        const childForName = node.childForFieldName(fieldName)

        if (childForName) {
          filedNodes.push(childForName)
          fields.push({ fieldName, node: childForName })
        }
      }
    } else {
      for (const fieldName of allFieldNames) {
        const childForName = node.childForFieldName(fieldName)

        if (childForName) {
          filedNodes.push(childForName)
          fields.push({ fieldName, node: childForName })
        }
      }

      nodeTypeToFieldsCache[nodeType] = fields.map(({ fieldName }) => fieldName)
    }

    const fieldChildNodes = {} as Record<string, PoorNodeType>
    const childNodes = []

    fields.forEach(({ fieldName, node }) => {
      fieldChildNodes[fieldName] = collectAstFromTree(
        node,
        level + 1,
        fieldName,
      )
    })

    const namedChildCount = node.namedChildCount

    for (let i = 0; i < namedChildCount; i++) {
      const childNode = node.namedChild(i)

      if (
        childNode &&
        !filedNodes.some((fieldNode) => fieldNode.equals(childNode))
      ) {
        childNodes.push(collectAstFromTree(childNode, level + 1, 'child'))
      }
    }

    const rawNode = {
      nodeType: nodeType,
      loc: getPosition(node),
      ...fieldChildNodes,
      ...(childNodes.length > 0 ? { children: childNodes } : {}),
    } as PoorNodeType

    const isLeaf = fields.length === 0 && childNodes.length === 0

    if (isLeaf && defineRawValueForNodeTypes.includes(nodeType)) {
      rawNode.rawValue = codeText.substring(
        //@ts-ignore
        rawNode.loc.start.index,
        //@ts-ignore
        rawNode.loc.end.index,
      )
    }

    return rawNode
  }

  return collectAstFromTree(tree.rootNode)
}
