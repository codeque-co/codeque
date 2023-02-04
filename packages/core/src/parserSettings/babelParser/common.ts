import { createWildcardUtils } from '../../wildcardUtilsFactory'

export const identifierNodeTypes = [
  'Identifier',
  'JSXIdentifier',
  'TSTypeParameter',
]

const numericWildcard = '0x0'
const wildcardChar = '$'

export const wildcardUtils = createWildcardUtils(
  identifierNodeTypes,
  numericWildcard,
  wildcardChar,
)
