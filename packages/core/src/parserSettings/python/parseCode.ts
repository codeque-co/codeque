import { treeSitterParserModuleFactory } from '../../treeSitterUtils'

const defineRawValueForNodeTypes = [
  'identifier',
  'integer',
  'string_content',
  'float',
]

export const parserModule = treeSitterParserModuleFactory({
  treeSitterParserName: 'tree-sitter-python',
  defineRawValueForNodeTypes,
})

export function parseCode(code: string) {
  return parserModule.parse(code)
}
