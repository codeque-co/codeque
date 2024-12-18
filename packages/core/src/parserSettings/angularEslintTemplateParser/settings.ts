import { parseForESLint } from '@angular-eslint/template-parser'
import {
  Location,
  MatchPosition,
  NumericLiteralUtils,
  ParserSettings,
  PoorNodeType,
  ProgramNodeAndBlockNodeUtils,
  StringLikeLiteralUtils,
  NodesComparatorParameters,
  GetUniqueTokensFromStringOrIdentifierNode,
} from '../../types'
import {
  decomposeString,
  normalizeText,
  runNodesComparators,
} from '../../utils'
import {
  getIdentifierNodeName,
  identifierNodeTypes,
  setIdentifierNodeName,
  wildcardUtils,
} from './common'
import { traverseAst } from '../../searchStages/traverseAndMatch'
import { beforeWildcardsComparators } from './beforeWildcardsComparators'

const supportedExtensions = ['html', 'htm']

const getProgramNodeFromRootNode = (rootNode: PoorNodeType) => rootNode // root node is program node

const getProgramBodyFromRootNode = (fileNode: PoorNodeType) => {
  return fileNode.templateNodes as PoorNodeType[]
}

const unwrapExpressionStatement = (node: PoorNodeType) => {
  return node as PoorNodeType
}

const createBlockStatementNode = (
  templateNodes: PoorNodeType[],
  position: MatchPosition,
) => ({
  type: 'Program',
  templateNodes,
  ...position,
})

const isNode = (maybeNode: PoorNodeType) => {
  return typeof maybeNode?.type === 'string'
}

const astPropsToSkip = [
  'range',
  'sourceSpan',
  'startSourceSpan',
  'endSourceSpan',
  'valueSpan',
  'keySpan',
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
  return parseForESLint(code, { filePath, range: true, loc: true })
    .ast as PoorNodeType
}

type NodeValueSanitizers = Record<string, Record<string, (a: any) => any>>

const nodeValuesSanitizers: NodeValueSanitizers = {
  ['Text$3']: {
    value: normalizeText,
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
  if (node.type === 'Text$3') {
    const value: string = getSanitizedNodeValue('Text$3', 'value', node.value)

    const shouldCompare = value.length > 0

    return shouldCompare
  }

  return true
}

const getNodeType = (node: PoorNodeType) => node.type as string

const isIdentifierNode = (node: PoorNodeType) =>
  identifierNodeTypes.includes(getNodeType(node))

const stringLikeLiteralUtils: StringLikeLiteralUtils = {
  // Text$3 is only pure string node
  isStringLikeLiteralNode: (node: PoorNodeType) => node.type === 'Text$3',
  getStringLikeLiteralValue: (node: PoorNodeType) => {
    return node?.value as string
  },
}

const numericLiteralUtils: NumericLiteralUtils = {
  isNumericLiteralNode: (node: PoorNodeType) => node.type === 'NumericLiteral',
  getNumericLiteralValue: (node: PoorNodeType) =>
    (node.extra as any).raw as string,
}

const programNodeAndBlockNodeUtils: ProgramNodeAndBlockNodeUtils = {
  isProgramNode: (node: PoorNodeType) => node.type === 'Program',
  isBlockNode: (node: PoorNodeType) => node.type === 'Program',
  programNodeBodyKey: 'templateNodes',
  blockNodeBodyKey: 'templateNodes',
}

const getNodePosition: ParserSettings['getNodePosition'] = (
  node: PoorNodeType,
) => ({
  start: ((node?.sourceSpan as any)?.start?.offset as number) ?? 0,
  end: ((node?.sourceSpan as any)?.end?.offset as number) ?? 0,
  loc: node.loc as unknown as Location,
})

const getParseErrorLocation = (e: any) => ({
  line: e.loc?.line ?? 0,
  column: e.loc?.column ?? 0,
})

const alternativeNodeTypes = {
  Identifier: identifierNodeTypes,
}

/**
 * To support wildcards in html we have to
 * - encode wildcard, do it in query text before parsing $$ => a_a_$$
 * - decode wildcard, traverse parsed query and: a_a_$$ => $$
 * `$$` is invalid tag name start in all html parsers
 */
const encodedWildcardSequence = 'a_$$_x'

const preprocessQueryCode = (code: string) => {
  const queryCode = code.replace(/(\$\$)/g, () => encodedWildcardSequence)

  return queryCode
}

const replaceEncodedWildcards = (value: string) =>
  value.replace(/a_\$\$_x/g, () => '$$')

const postprocessQueryNode = (queryNode: PoorNodeType) => {
  traverseAst(queryNode, isNode, getNodeType, {
    Element$1: (node) => {
      const nodeName = node.name as string

      if (nodeName.includes(encodedWildcardSequence)) {
        node.name = replaceEncodedWildcards(nodeName)
      }
    },
    TextAttribute: (node) => {
      const nodeValue = node.value as string

      if (nodeValue.includes(encodedWildcardSequence)) {
        node.value = replaceEncodedWildcards(nodeValue)
      }
    },
    Text$3: (node) => {
      const nodeValue = node.value as string

      if (nodeValue.includes(encodedWildcardSequence)) {
        node.value = replaceEncodedWildcards(nodeValue)
      }
    },
  })

  return queryNode
}

const compareNodesBeforeWildcardsComparison = (
  ...nodeComparatorParams: NodesComparatorParameters
) => {
  return runNodesComparators(beforeWildcardsComparators, nodeComparatorParams)
}

const getUniqueTokensFromStringOrIdentifierNode: GetUniqueTokensFromStringOrIdentifierNode =
  ({ queryNode, caseInsensitive, parserSettings }) => {
    const MIN_TOKEN_LEN = 2

    const { anyStringWildcardRegExp } = parserSettings.wildcardUtils
    const tokens: string[] = []

    const valuesToProcess: string[] = []

    if (queryNode.type === 'TextAttribute') {
      valuesToProcess.push(queryNode.name as string)
      valuesToProcess.push(queryNode.value as string)
    }

    if (queryNode.type === 'Element$1') {
      valuesToProcess.push(queryNode.name as string)
    }

    if (queryNode.type === 'Text$3') {
      valuesToProcess.push(queryNode.value as string)
    }

    valuesToProcess
      .map((val) =>
        parserSettings.wildcardUtils.removeWildcardAliasesFromStringLiteral(
          val,
        ),
      )
      .map((val) => decomposeString(val, anyStringWildcardRegExp))
      .flat(1)
      .forEach((part) => {
        if (part.length >= MIN_TOKEN_LEN) {
          tokens.push(caseInsensitive ? part.toLocaleLowerCase() : part)
        }
      })

    return tokens
  }

export const angularEslintTemplateParser: ParserSettings = {
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
  compareNodesBeforeWildcardsComparison,
  compareNodesAfterWildcardsComparison: () => undefined,
  identifierTypeAnnotationFieldName: 'typeAnnotation',
  stringLikeLiteralUtils,
  numericLiteralUtils,
  programNodeAndBlockNodeUtils,
  getNodePosition,
  getParseErrorLocation,
  alternativeNodeTypes,
  postprocessQueryNode,
  preprocessQueryCode,
  getUniqueTokensFromStringOrIdentifierNode,
}

export default angularEslintTemplateParser
