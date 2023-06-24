import { numericWildcard, wildcardChar } from '../_common/JSFamilyCommon'
import { createWildcardUtils } from '../../wildcardUtilsFactory'
import { PoorNodeType } from '../../types'
export const identifierNodeTypes = ['Identifier', 'JSXIdentifier']
export const getIdentifierNodeName = (node: PoorNodeType) => node.name as string
export const setIdentifierNodeName = (node: PoorNodeType, name: string) => {
  node.name = name
}

export const getNodeType = (node: PoorNodeType) => node.type as string

export const wildcardUtils = createWildcardUtils(
  identifierNodeTypes,
  numericWildcard,
  wildcardChar,
  getIdentifierNodeName,
)
