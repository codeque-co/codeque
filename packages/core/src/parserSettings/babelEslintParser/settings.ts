import {
  ParserSettings,
  PoorNodeType,
  Location,
  NodesComparatorParameters,
  NumericLiteralUtils,
  ProgramNodeAndBlockNodeUtils,
  StringLikeLiteralUtils,
  MatchPosition,
} from '../../types'
import { parse } from '@babel/eslint-parser'

import { supportedExtensions } from '../_common/JSFamilyCommon'

import {
  getNodeType,
  identifierNodeTypes,
  wildcardUtils,
  setIdentifierNodeName,
  getIdentifierNodeName,
} from './common'

import { normalizeText, runNodesComparators } from '../../utils'
import { afterWildcardsComparators } from './afterWildcardsComparators'
import { beforeWildcardsComparators } from './beforeWildcardsComparators'

const parseCode = (code: string, filePath = '') => {
  const maybeWrappedJSON = /\.json$/.test(filePath) ? `(${code})` : code
  try {
    return parse(maybeWrappedJSON, {
      filePath,
      sourceType: 'module',
      requireConfigFile: false,
      allowImportExportEverywhere: false,
      babelOptions: {
        babelrc: false,
        /**
         * ❗ Note that enabling config file makes babel look for package.json, which will crash in browser runtime
         * At some point we might need to enable resolving plugins from users config files, it might be blocking some syntaxes.
         * But since @babel/eslint-parser is bit retarded it terms of configuration, it might be an edge case which we will never run into.
         */
        configFile: false,
        parserOpts: {
          plugins: ['jsx'],
        },
      },
    }) as unknown as PoorNodeType
  } catch (e) {
    return parse(maybeWrappedJSON, {
      filePath,
      sourceType: 'module',
      requireConfigFile: false,
      allowImportExportEverywhere: false,
      babelOptions: {
        babelrc: false,
        configFile: false,
        parserOpts: {
          plugins: [],
        },
      },
    }) as unknown as PoorNodeType
  }
}

/**
 * We mimic @babel/eslint-parser, but we don't use it directly, as it has not documented API
 * We need this only for purpose of eslint plugin and to make sure that output AST is searchable
 */
const getProgramNodeFromRootNode = (fileOrProgramNode: PoorNodeType) =>
  'program' in fileOrProgramNode
    ? (fileOrProgramNode.program as PoorNodeType)
    : fileOrProgramNode

const getProgramBodyFromRootNode = (fileOrProgramNode: PoorNodeType) => {
  return getProgramNodeFromRootNode(fileOrProgramNode).body as PoorNodeType[]
}

const isIdentifierNode = (node: PoorNodeType) =>
  identifierNodeTypes.includes(getNodeType(node))

const alternativeNodeTypes = {
  Identifier: identifierNodeTypes,
  ChainExpression: ['MemberExpression'],
  MemberExpression: ['ChainExpression'],
  BlockStatement: ['Program'],
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
  'tokens',
  'start',
  'end',
  'extra',
]

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

export const babelEslintParserSettings: ParserSettings = {
  parseCode,
  getProgramNodeFromRootNode,
  getProgramBodyFromRootNode,
  isIdentifierNode,
  getNodeType,
  wildcardUtils,
  setIdentifierNodeName,
  alternativeNodeTypes,
  astPropsToSkip,
  supportedExtensions,
  isNode,
  identifierNodeTypes,
  isNodeFieldOptional,
  getIdentifierNodeName,
  unwrapExpressionStatement,
  createBlockStatementNode,
  getSanitizedNodeValue,
  shouldCompareNode,
  compareNodesBeforeWildcardsComparison,
  compareNodesAfterWildcardsComparison,
  identifierTypeAnnotationFieldName: 'typeAnnotation',
  stringLikeLiteralUtils,
  numericLiteralUtils,
  programNodeAndBlockNodeUtils,
  getNodePosition,
  getParseErrorLocation,
}

export default babelEslintParserSettings
