import { createWildcardUtils } from '../../wildcardUtilsFactory'
import { PoorNodeType } from '../../types'
import { getNodeType } from '../espreeParser/common'

/*
 * We don't have purely identifier nodes in this parser
 * We compare everything using string wildcards
 */

export const identifierNodeTypes: string[] = []

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
  getNodeType,
)
