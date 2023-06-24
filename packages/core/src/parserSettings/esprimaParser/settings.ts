import esprima, { parseModule } from 'esprima'

import {
  Location,
  NodesComparatorParameters,
  NumericLiteralUtils,
  ParserSettings,
  PoorNodeType,
  ProgramNodeAndBlockNodeUtils,
  StringLikeLiteralUtils,
  MatchPosition,
} from '../../types'
import { normalizeText, runNodesComparators } from '../../utils'
import { supportedExtensions } from '../_common/JSFamilyCommon'
import { afterWildcardsComparators } from './afterWildcardsComparators'
import { beforeWildcardsComparators } from './beforeWildcardsComparators'
import {
  getIdentifierNodeName,
  getNodeType,
  identifierNodeTypes,
  wildcardUtils,
  setIdentifierNodeName,
} from './common'

const getProgramNodeFromRootNode = (rootNode: PoorNodeType) => rootNode // root node is program node

const getProgramBodyFromRootNode = (rootNode: PoorNodeType) => {
  return getProgramNodeFromRootNode(rootNode).body as PoorNodeType[]
}

const unwrapExpressionStatement = (node: PoorNodeType) => {
  if (typeof node !== 'object') {
    return node
  }

  if (node.type === 'ExpressionStatement') {
    return node.expression as PoorNodeType
  }

  return node as PoorNodeType
}

const createBlockStatementNode = (
  body: PoorNodeType[],
  position: MatchPosition,
) =>
  ({
    type: 'BlockStatement',
    body,
    loc: position.loc,
    range: [position.start, position.end],
  } as unknown as PoorNodeType)

const isNode = (maybeNode: PoorNodeType) => {
  return typeof maybeNode?.type === 'string'
}

const isNodeFieldOptional = (nodeType: string, nodeFieldKey: string) => {
  // Eslint-typescript is about to remove optionality of properties https://github.com/typescript-eslint/typescript-eslint/pull/6274
  return true
}

const astPropsToSkip = [
  'loc',
  'range',
  'raw',
  'trailingComments',
  'leadingComments',
  'comments',
  'tail', // Support for partial matching of template literals
  'parent', // in eslint there is parent prop in node
  { type: 'ArrowFunctionExpression', key: 'expression' }, // flag on ArrowFunctionExpression
]

const parseCode = (code: string, filePath = '') => {
  const settings: esprima.ParseOptions = {
    jsx: true,
    range: true,
    loc: true,
  }
  const maybeWrappedJSON = /\.json$/.test(filePath) ? `(${code})` : code

  const ast = parseModule(maybeWrappedJSON, settings)

  return ast as unknown as PoorNodeType
}

const sanitizeTemplateElementValue = ({
  raw,
  cooked,
}: {
  raw: string
  cooked: string
}) => {
  return {
    raw: normalizeText(raw),
    cooked: normalizeText(cooked),
  }
}

type NodeValueSanitizers = Record<string, Record<string, (a: any) => any>>

const nodeValuesSanitizers: NodeValueSanitizers = {
  ['JSXText']: {
    value: normalizeText,
    raw: normalizeText,
  },
  ['TemplateElement']: {
    value: sanitizeTemplateElementValue,
  },
}

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
  if (node.type === 'JSXText') {
    const value: string = getSanitizedNodeValue('JSXText', 'value', node.value)

    return value.length > 0
  }

  return true
}

const compareNodesBeforeWildcardsComparison = (
  ...nodeComparatorParams: NodesComparatorParameters
) => {
  return runNodesComparators(beforeWildcardsComparators, nodeComparatorParams)
}

const compareNodesAfterWildcardsComparison = (
  ...nodeComparatorParams: NodesComparatorParameters
) => {
  return runNodesComparators(afterWildcardsComparators, nodeComparatorParams)
}

const isIdentifierNode = (node: PoorNodeType) =>
  identifierNodeTypes.includes(getNodeType(node))

const isFirstCharStringStart = (str: string) =>
  str.charAt(0) === `'` || str.charAt(0) === `"`

const stringLikeLiteralUtils: StringLikeLiteralUtils = {
  isStringLikeLiteralNode: (node: PoorNodeType) =>
    (node.type === 'Literal' && isFirstCharStringStart(node.raw as string)) ||
    node.type === 'TemplateElement' ||
    node.type === 'JSXText',
  getStringLikeLiteralValue: (node: PoorNodeType) => {
    if (node.type === 'TemplateElement') {
      const { raw } = sanitizeTemplateElementValue(
        node.value as { raw: string; cooked: string },
      )

      return raw
    }

    // (node.type === 'Literal' || node.type === 'JSXText'
    return normalizeText(node.value as string)
  },
}

const numericLiteralUtils: NumericLiteralUtils = {
  isNumericLiteralNode: (node: PoorNodeType) =>
    node.type === 'Literal' && !isFirstCharStringStart(node.raw as string),
  getNumericLiteralValue: (node: PoorNodeType) => node.raw as string,
}

const programNodeAndBlockNodeUtils: ProgramNodeAndBlockNodeUtils = {
  isProgramNode: (node: PoorNodeType) => node.type === 'Program',
  isBlockNode: (node: PoorNodeType) => node.type === 'BlockStatement',
  programNodeBodyKey: 'body',
  blockNodeBodyKey: 'body',
}

const getNodePosition: ParserSettings['getNodePosition'] = (
  node: PoorNodeType,
) => ({
  start: (node.range as any)[0] as number,
  end: (node.range as any)[1] as number,
  loc: node.loc as unknown as Location,
})

const getParseErrorLocation = (e: any) => ({
  line: e.lineNumber ?? 0,
  column: e.column ?? 0,
})

const alternativeNodeTypes = {
  Identifier: identifierNodeTypes,
  ChainExpression: ['MemberExpression'],
  MemberExpression: ['ChainExpression'],
  BlockStatement: ['Program'],
}

export const esprimaParserSettings: ParserSettings = {
  supportedExtensions,
  parseCode,
  isNode,
  isIdentifierNode,
  identifierNodeTypes,
  astPropsToSkip,
  isNodeFieldOptional,
  getProgramBodyFromRootNode,
  getProgramNodeFromRootNode,
  getIdentifierNodeName,
  setIdentifierNodeName,
  getNodeType,
  unwrapExpressionStatement,
  createBlockStatementNode,
  getSanitizedNodeValue,
  shouldCompareNode,
  wildcardUtils,
  compareNodesBeforeWildcardsComparison,
  compareNodesAfterWildcardsComparison,
  identifierTypeAnnotationFieldName: 'typeAnnotation',
  stringLikeLiteralUtils,
  numericLiteralUtils,
  programNodeAndBlockNodeUtils,
  getNodePosition,
  getParseErrorLocation,
  alternativeNodeTypes,
}

export default esprimaParserSettings
