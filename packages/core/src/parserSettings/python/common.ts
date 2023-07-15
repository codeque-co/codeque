import { createWildcardUtils } from '../../wildcardUtilsFactory'
import { PoorNodeType } from '../../types'

/*
 * We don't have purely identifier nodes in this parser
 * We compare everything using string wildcards
 */

export const identifierNodeTypes: string[] = ['identifier']

const wildcardChar = '$'
const numericWildcard = '0x0'

export const getIdentifierNodeName = (node: PoorNodeType) =>
  node.rawValue as string

export const setIdentifierNodeName = (node: PoorNodeType, name: string) => {
  node.rawValue = name
}

export const getNodeType = (node: PoorNodeType) => node.nodeType as string

export const wildcardUtils = createWildcardUtils(
  identifierNodeTypes,
  numericWildcard,
  wildcardChar,
  getIdentifierNodeName,
  getNodeType,
)
