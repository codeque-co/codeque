import { parse, ParserOptions } from '@typescript-eslint/parser'
import {
  Location,
  Match,
  NodesComparatorParameters,
  NumericLiteralUtils,
  ParserSettings,
  PoorNodeType,
  ProgramNodeAndBlockNodeUtils,
  StringLikeLiteralUtils,
} from '../../types'
import { normalizeText, runNodesComparators } from '../../utils'
import { supportedExtensions } from '../_common/JSFamilyCommon'
import { afterWildcardsComparators } from './afterWildcardsComparators'
import { beforeWildcardsComparators } from './beforeWildcardsComparators'
import { identifierNodeTypes, wildcardUtils } from './common'

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
  position: Omit<Match, 'node'>,
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
  const parseOptions: ParserOptions = {
    sourceType: 'module',
    ecmaFeatures: {
      globalReturn: true,
      jsx: true,
    },
    ecmaVersion: 6,
    range: true,
    loc: true,
    comment: true, //for asserting they are skipped
  }

  const maybeWrappedJSON = /\.json$/.test(filePath) ? `(${code})` : code

  return parse(maybeWrappedJSON, parseOptions) as unknown as PoorNodeType
}

const generateCode = (node: PoorNodeType, options?: unknown) => {
  return 'Not supported'
}

const sanitizeJSXText = (node: PoorNodeType) => {
  //@ts-ignore
  node.value = normalizeText(node.value)
  //@ts-ignore
  node.raw = normalizeText(node.raw)
}

const sanitizeTemplateElement = (node: PoorNodeType) => {
  //@ts-ignore
  node.value.raw = normalizeText(node.value.raw)
  //@ts-ignore
  node.value.cooked = normalizeText(node.value.cooked)
}

const sanitizeNode = (node: PoorNodeType) => {
  if (node?.type === 'TemplateElement') {
    sanitizeTemplateElement(node)
  } else if (node?.type === 'JSXText') {
    sanitizeJSXText(node)
  }
}

const shouldCompareNode = (node: PoorNodeType) => {
  if (node.type === 'JSXText') {
    sanitizeJSXText(node)

    return (node.value as string).length > 0
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

const getIdentifierNodeName = (node: PoorNodeType) => node.name as string
const getNodeType = (node: PoorNodeType) => node.type as string

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
    return ((node.value as any)?.raw as string) ?? (node?.value as string)
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

export const typescriptEslintParserSettings: ParserSettings = {
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
  sanitizeNode,
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

export default typescriptEslintParserSettings
