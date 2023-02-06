import { parse, ParserOptions, ParserPlugin } from '@babel/parser'
import { NODE_FIELDS } from '@babel/types'
import {
  ParserSettings,
  PoorNodeType,
  NodesComparatorParameters,
  StringLikeLiteralUtils,
  NumericLiteralUtils,
  ProgramNodeAndBlockNodeUtils,
  Location,
  Match,
} from '../../types'
import { normalizeText, runNodesComparators } from '../../utils'
import { beforeWildcardsComparators } from './beforeWildcardsComparators'
import { afterWildcardsComparators } from './afterWildcardsComparators'
import { supportedExtensions } from '../_common/JSFamilyCommon'
import {} from '../../wildcardUtilsFactory'
import { identifierNodeTypes, wildcardUtils } from './common'

const getProgramNodeFromRootNode = (fileNode: PoorNodeType) =>
  fileNode.program as PoorNodeType

const getProgramBodyFromRootNode = (fileNode: PoorNodeType) => {
  return getProgramNodeFromRootNode(fileNode).body as PoorNodeType[]
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
) => ({
  type: 'BlockStatement',
  body,
  directives: [], // whatever it is
  ...position,
})

const isNode = (maybeNode: PoorNodeType) => {
  return typeof maybeNode?.type === 'string'
}

const isNodeFieldOptional = (nodeType: string, nodeFieldKey: string) => {
  return Boolean(
    (NODE_FIELDS[nodeType] as { [key: string]: { optional: boolean } })[
      nodeFieldKey
    ]?.optional ?? true,
  )
}

const astPropsToSkip = [
  'loc',
  'start',
  'end',
  'extra',
  'trailingComments',
  'leadingComments',
  'innerComments',
  'comments',
  'tail', // Support for partial matching of template literals
]

const parseCode = (code: string, filePath = '') => {
  const pluginsWithoutJSX = [
    'typescript',
    'decorators-legacy',
    'importAssertions',
    'doExpressions',
  ] as ParserPlugin[]
  const pluginsWithJSX = [...pluginsWithoutJSX, 'jsx'] as ParserPlugin[]

  const parseOptionsWithJSX = {
    sourceType: 'module',
    plugins: pluginsWithJSX,
    allowReturnOutsideFunction: true,
  } as ParserOptions

  const parseOptionsWithoutJSX = {
    sourceType: 'module',
    plugins: pluginsWithoutJSX,
    allowReturnOutsideFunction: true,
  } as ParserOptions

  const maybeWrappedJSON = /\.json$/.test(filePath) ? `(${code})` : code

  try {
    return parse(
      maybeWrappedJSON,
      parseOptionsWithJSX,
    ) as unknown as PoorNodeType
  } catch (e) {
    return parse(
      maybeWrappedJSON,
      parseOptionsWithoutJSX,
    ) as unknown as PoorNodeType
  }
}

const sanitizeJSXText = (node: PoorNodeType) => {
  //@ts-ignore
  node.value = normalizeText(node.value)
  //@ts-ignore
  node.extra.raw = normalizeText(node.extra.raw)
  //@ts-ignore
  node.extra.rawValue = normalizeText(node.extra.rawValue)
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

const stringLikeLiteralUtils: StringLikeLiteralUtils = {
  isStringLikeLiteralNode: (node: PoorNodeType) =>
    node.type === 'StringLiteral' ||
    node.type === 'TemplateElement' ||
    node.type === 'JSXText',
  getStringLikeLiteralValue: (node: PoorNodeType) => {
    return ((node.value as any)?.raw as string) ?? (node?.value as string)
  },
}

const numericLiteralUtils: NumericLiteralUtils = {
  isNumericLiteralNode: (node: PoorNodeType) => node.type === 'NumericLiteral',
  getNumericLiteralValue: (node: PoorNodeType) =>
    (node.extra as any).raw as string,
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
  start: node.start as number,
  end: node.end as number,
  loc: node.loc as unknown as Location,
})

export const babelParserSettings: ParserSettings = {
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
}
