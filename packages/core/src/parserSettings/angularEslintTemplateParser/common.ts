import { createWildcardUtils } from '../../wildcardUtilsFactory'
import { PoorNodeType } from '../../types'

export const identifierNodeTypes = ['Element$1']

const wildcardChar = '$'
const numericWildcard = '0x0'

export const getIdentifierNodeName = (node: PoorNodeType) => node.name as string
export const setIdentifierNodeName = (node: PoorNodeType, name: string) => {
  node.name = name
}

export const wildcardUtils = createWildcardUtils(
  identifierNodeTypes,
  numericWildcard,
  wildcardChar,
  getIdentifierNodeName,
)
