import { parse, ParseOptions, toPlainObject } from 'css-tree'
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
import { afterWildcardsComparators } from './afterWildcardsComparators'

const supportedExtensions = ['css']

const getProgramNodeFromRootNode = (rootNode: PoorNodeType) => rootNode // root node is program node

const getProgramBodyFromRootNode = (fileNode: PoorNodeType) => {
  return fileNode.children as PoorNodeType[]
}

const unwrapExpressionStatement = (node: PoorNodeType) => {
  return node as PoorNodeType
}

const createBlockStatementNode = (
  children: PoorNodeType[],
  position: MatchPosition,
) => ({
  type: 'Block',
  children,
  ...position,
})

const isNode = (maybeNode: PoorNodeType) => {
  return typeof maybeNode?.type === 'string'
}

const astPropsToSkip = ['loc']

const parseCode = (code: string) => {
  const sharedOptions: ParseOptions = {
    parseAtrulePrelude: true,
    parseRulePrelude: true,
    parseValue: true,
    positions: true,
  }

  if (code.includes('{')) {
    return toPlainObject(
      parse(code, { ...sharedOptions, context: 'stylesheet' }),
    ) as unknown as PoorNodeType
  } else {
    return toPlainObject(
      parse(code, { ...sharedOptions, context: 'declarationList' }),
    ) as unknown as PoorNodeType
  }
}

type NodeValueSanitizers = Record<string, Record<string, (a: any) => any>>

const nodeValuesSanitizers: NodeValueSanitizers = {
  ['Raw']: {
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
  if (node.type === 'WhiteSpace') {
    return false
  }

  if (node.type === 'Raw') {
    const value: string = getSanitizedNodeValue('Raw', 'value', node.value)

    const shouldCompare = value.length > 0

    return shouldCompare
  }

  return true
}

const getNodeType = (node: PoorNodeType) => node.type as string

const isIdentifierNode = (node: PoorNodeType) =>
  identifierNodeTypes.includes(getNodeType(node))

const stringLikeNodeTypes = [
  'TypeSelector',
  'Raw',
  'ClassSelector',
  'Identifier',
  'IdSelector',
  'Url',
]

const stringLikeLiteralUtils: StringLikeLiteralUtils = {
  // Raw is only pure string node
  isStringLikeLiteralNode: (node: PoorNodeType) =>
    stringLikeNodeTypes.includes(node.type as string),
  getStringLikeLiteralValue: (node: PoorNodeType) => {
    return (node?.value as string) || (node?.name as string)
  },
}

const pureNumericNodes = ['Percentage', 'Number', 'Hash']

const numericLiteralUtils: NumericLiteralUtils = {
  isNumericLiteralNode: (node: PoorNodeType) =>
    pureNumericNodes.includes(node.type as string),
  getNumericLiteralValue: (node: PoorNodeType) => node.value as string,
}

const programNodeAndBlockNodeUtils: ProgramNodeAndBlockNodeUtils = {
  isProgramNode: (node: PoorNodeType) => node.type === 'StyleSheet',
  isBlockNode: (node: PoorNodeType) => node.type === 'Block',
  programNodeBodyKey: 'children',
  blockNodeBodyKey: 'children',
}

const getNodePosition: ParserSettings['getNodePosition'] = (
  node: PoorNodeType,
) => {
  const location = node.loc as unknown as Location

  return {
    start: ((location as any)?.start?.offset as number) ?? 0,
    end: ((location as any)?.end?.offset as number) ?? 0,
    loc: {
      start: {
        line: location.start.line,
        column: location.start.column - 1, // We need 0-based, parser return 1-based
      },
      end: {
        line: location.end.line,
        column: location.end.column - 1, // We need 0-based, parser return 1-based
      },
    },
  }
}

const getParseErrorLocation = (e: any) => ({
  line: e.loc?.line ?? 0,
  column: e.loc?.column ?? 0,
})

const alternativeNodeTypes = {
  Identifier: identifierNodeTypes,
}

/**
 * To support wildcards in caa we have to
 * - encode wildcard, do it in query text before parsing $$ => a_a_x
 * - decode wildcard, traverse parsed query and: a_a_x => $$
 * - Same for numeric wildcard 0x0 -> 00000000 // 0{8}
 * `$$` is invalid tag name start in all html parsers
 */
const encodedStringWildcardSequence = 'a_a_a'
const encodedNodesTreeWildcardSequence = 'z_z_z'

const encodedNumericWildcardSequence = '00000000'

const preprocessQueryCode = (code: string) => {
  const queryCode = code
    .replace(/(\$\$\$)/g, () => encodedNodesTreeWildcardSequence)
    .replace(/(\$\$)/g, () => encodedStringWildcardSequence)
    .replace(/0x0/g, encodedNumericWildcardSequence)

  return queryCode
}

const replaceEncodedWildcards = (value: string) =>
  value
    .replace(/a_a_a/g, () => '$$')
    .replace(/z_z_z/g, () => '$$$')
    .replace(/0{8}/g, '0x0')

const stringNodeTypes = {
  withName: [
    'Identifier',
    'IdSelector',
    'MediaFeature',
    'ClassSelector',
    'PseudoClassSelector',
    'PseudoElementSelector',
    'TypeSelector',
    'Function',
    'Combinator',
  ],
  withValue: ['String', 'Url'],
  withProperty: ['Declaration'],
}

const postprocessQueryNodeWithName = (node: PoorNodeType) => {
  const name = node.name as string

  if (
    name.includes(encodedStringWildcardSequence) ||
    name.includes(encodedNodesTreeWildcardSequence)
  ) {
    node.name = replaceEncodedWildcards(name)
  }
}

const postprocessQueryNodeWithValue = (node: PoorNodeType) => {
  const value = node.value as string

  if (
    value.includes(encodedStringWildcardSequence) ||
    value.includes(encodedNodesTreeWildcardSequence) ||
    value.includes(encodedNumericWildcardSequence)
  ) {
    node.value = replaceEncodedWildcards(value)
  }
}

const postprocessQueryNodeWithProperty = (node: PoorNodeType) => {
  const property = node.property as string

  if (
    property.includes(encodedStringWildcardSequence) ||
    property.includes(encodedNodesTreeWildcardSequence)
  ) {
    node.property = replaceEncodedWildcards(property)
  }
}

const createVisitorsForNodeTypes = (
  types: string[],
  visitorFn: (node: PoorNodeType) => void,
) =>
  types.reduce(
    (visitorsMap, nodeType) => ({
      ...visitorsMap,
      [nodeType]: visitorFn,
    }),
    {},
  )

const postprocessVisitors = {
  ...createVisitorsForNodeTypes(
    stringNodeTypes.withName,
    postprocessQueryNodeWithName,
  ),
  ...createVisitorsForNodeTypes(
    stringNodeTypes.withProperty,
    postprocessQueryNodeWithProperty,
  ),
  ...createVisitorsForNodeTypes(
    [...stringNodeTypes.withValue, ...pureNumericNodes],
    postprocessQueryNodeWithValue,
  ),
  Dimension: (node: PoorNodeType) => {
    const unit = node.unit as string
    const value = node.value as string

    if (unit.includes(encodedStringWildcardSequence)) {
      node.unit = replaceEncodedWildcards(unit)
    }

    if (value === encodedNumericWildcardSequence) {
      node.value = replaceEncodedWildcards(value)
    }
  },
}

const postprocessQueryNode = (queryNode: PoorNodeType) => {
  traverseAst(queryNode, isNode, getNodeType, postprocessVisitors)

  return queryNode
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

const getUniqueTokensFromStringOrIdentifierNode: GetUniqueTokensFromStringOrIdentifierNode =
  ({ queryNode, caseInsensitive, parserSettings }) => {
    const MIN_TOKEN_LEN = 2

    const { anyStringWildcardRegExp } = parserSettings.wildcardUtils
    const tokens: string[] = []

    const valuesToProcess: string[] = []

    if (stringNodeTypes.withName.includes(queryNode.type as string)) {
      valuesToProcess.push(queryNode.name as string)
    }

    if (stringNodeTypes.withProperty.includes(queryNode.type as string)) {
      valuesToProcess.push(queryNode.property as string)
    }

    if (stringNodeTypes.withValue.includes(queryNode.type as string)) {
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

export const cssTree: ParserSettings = {
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
  compareNodesAfterWildcardsComparison,
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

export default cssTree
