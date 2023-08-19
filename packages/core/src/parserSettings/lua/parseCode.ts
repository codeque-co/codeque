import { treeSitterParserModuleFactory } from '../../treeSitterUtils'
import { PoorNodeType, Location } from '../../types'

const defineRawValueForNodeTypes = ['identifier', 'number', 'string_content']

const postProcessNodes = {
  function_declaration: (node: PoorNodeType) => {
    /**
     * Global scope function declaration without name should be same as anonymous function definition passed as argument
     */
    if ((node.name as PoorNodeType)?.rawValue === '') {
      node.nodeType = 'function_definition'
      node.name = null

      return node
    }

    return node
  },
  function_definition: (node: PoorNodeType) => {
    /**
     * Anonymous function definition should have null name field to be compared with `function_declaration` changed into `function_definition`
     * We could use delete operator on `function_declaration`, but it's slow.
     */
    if (node.name === undefined) {
      node.name = null
    }

    return node
  },
  binary_expression: (node: PoorNodeType, codeText: string) => {
    const leftNodeLocationLoc = (node.left as PoorNodeType).loc as Location

    const leftNodeLocationEndIndex = leftNodeLocationLoc.end.index as number

    const rightNodeLocationLoc = (node.right as PoorNodeType).loc as Location

    const rightNodeLocationStartIndex = rightNodeLocationLoc.start
      .index as number

    const operator = codeText.substring(
      leftNodeLocationEndIndex,
      rightNodeLocationStartIndex,
    )

    const operatorNode = {
      nodeType: '__codeque__operator',
      rawValue: operator.trim(),
      loc: {
        /**
         * We could adjust location to be without spaces, but it does not matter actually
         */
        start: leftNodeLocationLoc.end,
        end: rightNodeLocationLoc.start,
      },
    }

    node.operator = operatorNode

    return node
  },
  function_call: (node: PoorNodeType) => {
    if ((node.name as PoorNodeType).rawValue === '') {
      const actualContent = (
        (node.arguments as PoorNodeType).children as PoorNodeType[]
      )[0]

      return {
        nodeType: 'expression_list',
        loc: node.loc,
        children: [actualContent],
      }
    }

    return node
  },
  parenthesized_expression: (node: PoorNodeType) => {
    const children = node.children as PoorNodeType[]

    // Remove empty identifiers from parenthesized_expression
    if (
      children.length === 1 &&
      (children[0] as PoorNodeType)?.rawValue === ''
    ) {
      return { ...node, children: [] }
    }

    return node
  },
}

export const parserModule = treeSitterParserModuleFactory({
  treeSitterParserName: 'tree-sitter-lua',
  postProcessNodes,
  defineRawValueForNodeTypes,
})

const isRawString = (code: string) => {
  const trimmedCode = code.trim()

  return (
    !trimmedCode.includes('\n') &&
    ((trimmedCode.startsWith("'") && trimmedCode.endsWith("'")) ||
      (trimmedCode.startsWith('"') && trimmedCode.endsWith('"')))
  )
}

export function parseCode(code: string) {
  const trimmedCode = code.trim()

  if (isRawString(trimmedCode)) {
    /**
     * Just string literal query is strangely parsed, so we parse it manually
     */
    const loc = {
      start: {
        line: 1,
        column: 0,
        index: 0,
      },
      end: {
        line: 1,
        column: trimmedCode.length,
        index: trimmedCode.length,
      },
    }

    return {
      nodeType: 'chunk',
      loc,
      children: [
        {
          nodeType: 'expression_list',
          loc,
          children: [
            {
              nodeType: 'string',
              loc,
              content: {
                nodeType: 'string_content',
                loc: {
                  start: {
                    line: 1,
                    column: loc.start.column + 1,
                    index: loc.start.index + 1,
                  },
                  end: {
                    line: 1,
                    column: loc.end.column - 1,
                    index: loc.end.index - 1,
                  },
                },
                children: [],
                rawValue: trimmedCode.substring(1, trimmedCode.length - 1),
              },
              end: null,
              start: null,
            },
          ],
        },
      ],
    }
  }

  try {
    return parserModule.parse(code)
  } catch (originalCodeParserError) {
    /**
     * Lua does not support standalone expressions in the code.
     *
     * To workaround that, when parser error occurs, we create variable assignment to extract expression_list
     *
     * we throw original error if that extraction fails, because our changes might produce also broken code.
     */

    try {
      const modifiedCode = `__codeque = ${trimmedCode}`

      const modifiedCodeAst = parserModule.parse(modifiedCode)

      const expression_list = (modifiedCodeAst as any)?.children?.[0]
        ?.children?.[1] as PoorNodeType

      return {
        nodeType: 'chunk',
        loc: expression_list.loc,
        children: [expression_list],
      }
    } catch (e) {
      throw originalCodeParserError
    }
  }
}
