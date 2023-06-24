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
  MatchPosition,
} from '../../types'

import { normalizeText, runNodesComparators } from '../../utils'
import { beforeWildcardsComparators } from './beforeWildcardsComparators'
import { afterWildcardsComparators } from './afterWildcardsComparators'
import {
  supportedExtensions,
  babelParseOptionsWithJSX,
  babelParseOptionsWithoutJSX,
} from '../_common/JSFamilyCommon'
import {
  getIdentifierNodeName,
  getNodeType,
  identifierNodeTypes,
  wildcardUtils,
  setIdentifierNodeName,
} from './common'

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
  position: MatchPosition,
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
  const maybeWrappedJSON = /\.json$/.test(filePath) ? `(${code})` : code
  try {
    return parse(
      maybeWrappedJSON,
      babelParseOptionsWithJSX,
    ) as unknown as PoorNodeType
  } catch (e) {
    return parse(
      maybeWrappedJSON,
      babelParseOptionsWithoutJSX,
    ) as unknown as PoorNodeType
  }
}

const sanitizeJSXTextExtraValue = ({
  raw,
  rawValue,
}: {
  raw: string
  rawValue: string
}) => {
  return {
    raw: normalizeText(raw),
    rawValue: normalizeText(rawValue),
  }
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
    extra: sanitizeJSXTextExtraValue,
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

const stringLikeLiteralUtils: StringLikeLiteralUtils = {
  isStringLikeLiteralNode: (node: PoorNodeType) =>
    node.type === 'StringLiteral' ||
    node.type === 'TemplateElement' ||
    node.type === 'JSXText',
  getStringLikeLiteralValue: (node: PoorNodeType) => {
    if (node.type === 'TemplateElement') {
      const { raw } = sanitizeTemplateElementValue(
        node.value as { raw: string; cooked: string },
      )

      return raw
    }

    // (node.type === 'StringLiteral' || node.type === 'JSXText'
    return normalizeText(node.value as string)
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
): MatchPosition => ({
  start: node.start as number,
  end: node.end as number,
  loc: node.loc as unknown as Location,
})

const getParseErrorLocation = (e: any) => ({
  line: e.loc?.line ?? 0,
  column: e.loc?.column ?? 0,
})

const alternativeNodeTypes = {
  Identifier: identifierNodeTypes,
  MemberExpression: ['OptionalMemberExpression'],
  OptionalMemberExpression: ['MemberExpression'],
  BlockStatement: ['Program'],
}

export const babelParserSettings: ParserSettings = {
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

export default babelParserSettings
