import { createWildcardUtils } from '../../wildcardUtilsFactory'
import { PoorNodeType } from '../../types'

/*
 * TextAttribute is considered identifier node name only for purpose of shallow match
 * It contains both prop and value strings.
 * We have custom matcher for TextAttribute node so it will never get compared by generic wildcard utils
 */

export const identifierNodeTypes = ['Element$1', 'TextAttribute']

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
