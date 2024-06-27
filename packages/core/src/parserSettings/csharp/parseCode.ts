import { treeSitterParserModuleFactory } from '../../treeSitterUtils'
import { PoorNodeType } from '../../types'

const defineRawValueForNodeTypes = [
  'identifier',
  'integer',
  'string_literal_content',
  'float',
]

export const parserModule = treeSitterParserModuleFactory({
  treeSitterParserName: 'tree-sitter-c-sharp',
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
      nodeType: 'string_literal',
      loc,
      children: [
        {
          nodeType: 'string_literal_content',
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
          rawValue: trimmedCode.substring(1, trimmedCode.length - 1),
        },
      ],
      end: null,
      start: null,
    }
  }

  return parserModule.parse(code)

  // try {
  //   return parserModule.parse(code)
  // } catch (originalCodeParserError) {
  //   try {
  //     const modifiedCode = `__codeque = ${trimmedCode}`

  //     const modifiedCodeAst = parserModule.parse(modifiedCode)

  //     const expression_list = (modifiedCodeAst as any)?.children?.[0]
  //       ?.children?.[1] as PoorNodeType

  //     return {
  //       nodeType: 'chunk',
  //       loc: expression_list.loc,
  //       children: [expression_list],
  //     }
  //   } catch (e) {
  //     throw originalCodeParserError
  //   }
  // }
}
