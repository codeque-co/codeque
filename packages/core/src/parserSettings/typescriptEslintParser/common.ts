import { numericWildcard, wildcardChar } from '../_common/JSFamilyCommon'
import { createWildcardUtils } from '../../wildcardUtilsFactory'
export const identifierNodeTypes = ['Identifier', 'JSXIdentifier']

export const wildcardUtils = createWildcardUtils(
  identifierNodeTypes,
  numericWildcard,
  wildcardChar,
)
