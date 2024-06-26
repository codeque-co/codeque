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

import {
  getIdentifierNodeName,
  getNodeType,
  identifierNodeTypes,
  setIdentifierNodeName,
  wildcardUtils,
} from './common'
import { parseCode, parserModule } from './parseCode'

const supportedExtensions = ['cs']

const getProgramNodeFromRootNode = (rootNode: PoorNodeType) => rootNode // root node is program node

const getProgramBodyFromRootNode = (fileNode: PoorNodeType) => {
  return fileNode.children as PoorNodeType[]
}

const unwrapExpressionStatement = (node: PoorNodeType) => {
  return node.nodeType === 'expression_statement' && node.children
    ? ((node.children as PoorNodeType[])[0] as PoorNodeType)
    : node
}

const createBlockStatementNode = (
  children: PoorNodeType[],
  position: MatchPosition,
) => ({
  nodeType: 'block',
  children,
  ...position,
})

const isNode = (maybeNode: PoorNodeType) => {
  return typeof maybeNode?.nodeType === 'string'
}

/* start and end is added by CQ in multiline queries  */
const astPropsToSkip = ['loc', 'start', 'end']

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

const stringLikeLiteralUtils: StringLikeLiteralUtils = {
  isStringLikeLiteralNode: (node: PoorNodeType) =>
    node.nodeType === 'string_content',
  getStringLikeLiteralValue: (node: PoorNodeType) => {
    return node?.rawValue as string
  },
}

const numericLiteralUtils: NumericLiteralUtils = {
  isNumericLiteralNode: (node: PoorNodeType) => node.nodeType === 'number',
  getNumericLiteralValue: (node: PoorNodeType) => node?.rawValue as string,
}

const programNodeAndBlockNodeUtils: ProgramNodeAndBlockNodeUtils = {
  isProgramNode: (node: PoorNodeType) =>
    node.nodeType === 'namespace_declaration',
  isBlockNode: (node: PoorNodeType) => node.nodeType === 'block',
  programNodeBodyKey: 'children',
  blockNodeBodyKey: 'children',
}

const getNodePosition: ParserSettings['getNodePosition'] = (
  node: PoorNodeType,
) => ({
  start: ((node?.loc as any)?.start?.index as number) ?? 0,
  end: ((node?.loc as any)?.end?.index as number) ?? 0,
  loc: node.loc as unknown as Location,
})

const getParseErrorLocation = (e: any) => ({
  line: e.loc?.start?.line ?? 0,
  column: e.loc?.start?.column ?? 0,
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
    string_content: (node) => {
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

export const csharpParser: ParserSettings = {
  supportedExtensions,
  parseCode,
  isNode,
  isIdentifierNode,
  astPropsToSkip,
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
  identifierTypeAnnotationFieldName: '',
  stringLikeLiteralUtils,
  numericLiteralUtils,
  programNodeAndBlockNodeUtils,
  getNodePosition,
  getParseErrorLocation,
  alternativeNodeTypes,
  preprocessQueryCode,
  postprocessQueryNode,
  init: parserModule.init,
}

export default csharpParser
