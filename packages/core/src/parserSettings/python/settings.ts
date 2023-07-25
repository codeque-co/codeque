import { traverseAst } from '../../searchStages/traverseAndMatch'
import {
  Location,
  MatchPosition,
  NumericLiteralUtils,
  ParserSettings,
  PoorNodeType,
  ProgramNodeAndBlockNodeUtils,
  StringLikeLiteralUtils,
} from '../../types'
import { normalizeText } from '../../utils'
import {
  getIdentifierNodeName,
  getNodeType,
  identifierNodeTypes,
  setIdentifierNodeName,
  wildcardUtils,
} from './common'
import { parseCode, parserInitPromise } from './parseCode'

const supportedExtensions = ['py']

const getProgramNodeFromRootNode = (rootNode: PoorNodeType) => rootNode // root node is program node

const getProgramBodyFromRootNode = (fileNode: PoorNodeType) => {
  return fileNode.children as PoorNodeType[]
}

//TODO
const unwrapExpressionStatement = (node: PoorNodeType) => {
  return node as PoorNodeType
}

//TODO
const createBlockStatementNode = (
  templateNodes: PoorNodeType[],
  position: MatchPosition,
) => ({
  type: 'Program',
  templateNodes,
  ...position,
})

const isNode = (maybeNode: PoorNodeType) => {
  return typeof maybeNode?.nodeType === 'string'
}

const isNodeFieldOptional = (nodeType: string, nodeFieldKey: string) => {
  return true
}

const astPropsToSkip = ['loc']

type NodeValueSanitizers = Record<string, Record<string, (a: any) => any>>

const nodeValuesSanitizers: NodeValueSanitizers = {}

const getSanitizedNodeValue = (
  nodeType: string,
  valueKey: string,
  value: unknown,
) => {
  const valueSanitizer = nodeValuesSanitizers?.[nodeType]?.[valueKey]

  if (valueSanitizer) {
    return valueSanitizer(value)
  }

  return value
}

const shouldCompareNode = (node: PoorNodeType) => {
  return true
}

const isIdentifierNode = (node: PoorNodeType) =>
  identifierNodeTypes.includes(getNodeType(node))

// TODO remove ' and " from string
const stringLikeLiteralUtils: StringLikeLiteralUtils = {
  isStringLikeLiteralNode: (node: PoorNodeType) => node.nodeType === 'string',
  getStringLikeLiteralValue: (node: PoorNodeType) => {
    return node?.rawValue as string
  },
}
// TODO add other numeric types
const numericLiteralUtils: NumericLiteralUtils = {
  isNumericLiteralNode: (node: PoorNodeType) => node.nodeType === 'Integer',
  getNumericLiteralValue: (node: PoorNodeType) => node?.rawValue as string,
}

const programNodeAndBlockNodeUtils: ProgramNodeAndBlockNodeUtils = {
  isProgramNode: (node: PoorNodeType) => node.nodeType === 'module',
  isBlockNode: (node: PoorNodeType) => node.nodeType === 'block',
  programNodeBodyKey: 'children',
  blockNodeBodyKey: 'body',
}

const getNodePosition: ParserSettings['getNodePosition'] = (
  node: PoorNodeType,
) => ({
  start: ((node?.loc as any)?.start?.index as number) ?? 0,
  end: ((node?.loc as any)?.end?.index as number) ?? 0,
  loc: node.loc as unknown as Location,
})

const getParseErrorLocation = (e: any) => ({
  line: e.loc?.line ?? 0,
  column: e.loc?.column ?? 0,
})

const alternativeNodeTypes = {
  identifier: identifierNodeTypes,
}

const encodedIdentifierWildcardSequence = 'a_x_2_x_a'
const encodedNodeWildcardSequence = 'a_x_3_x_a'

const preprocessQueryCode = (code: string) => {
  const queryCode = code
    .replace(/(\$\$\$)/g, () => encodedNodeWildcardSequence)
    .replace(/(\$\$)/g, () => encodedIdentifierWildcardSequence)

  return queryCode
}

const replaceEncodedWildcards = (value: string) =>
  value.replace(/a_x_3_x_a/g, () => '$$$').replace(/a_x_2_x_a/g, () => '$$')

const postprocessQueryNode = (queryNode: PoorNodeType) => {
  traverseAst(queryNode, isNode, getNodeType, {
    identifier: (node) => {
      const nodeName = node.rawValue as string

      if (
        nodeName.includes(encodedNodeWildcardSequence) ||
        nodeName.includes(encodedIdentifierWildcardSequence)
      ) {
        node.rawValue = replaceEncodedWildcards(nodeName)
      }
    },
  })

  return queryNode
}

export const pythonParser: ParserSettings = {
  supportedExtensions,
  parseCode,
  isNode,
  isIdentifierNode,
  astPropsToSkip,
  isNodeFieldOptional,
  getProgramBodyFromRootNode,
  getProgramNodeFromRootNode,
  getIdentifierNodeName,
  getNodeType,
  unwrapExpressionStatement,
  createBlockStatementNode,
  getSanitizedNodeValue,
  identifierNodeTypes,
  setIdentifierNodeName,
  shouldCompareNode,
  wildcardUtils,
  compareNodesBeforeWildcardsComparison: () => undefined,
  compareNodesAfterWildcardsComparison: () => undefined,
  // TODO
  identifierTypeAnnotationFieldName: 'TODO',
  stringLikeLiteralUtils,
  numericLiteralUtils,
  programNodeAndBlockNodeUtils,
  getNodePosition,
  getParseErrorLocation,
  alternativeNodeTypes,
  preprocessQueryCode,
  postprocessQueryNode,
  parserInitPromise,
}

export default pythonParser

/**
 * TODOs:
 * - Check how types structure is represented and whether our fields cache is breaking the types matching
 * - Support string interpolation `f"project:{self.project_id}:rules"`
 *   - We need to extract string literals and interpolated expressions to node
 * - support detecting python in search from selection
 * -
 */
