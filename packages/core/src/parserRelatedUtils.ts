import { parse, ParserOptions, ParserPlugin } from '@babel/parser'
import { NODE_FIELDS } from '@babel/types'
import { ParserSettings, PoorNodeType } from './types'
import { nonIdentifierOrKeywordGlobal, normalizeText } from './utils'
// parser specific
const getProgramBodyFromRootNode = (fileNode: PoorNodeType) => {
  return (fileNode.program as PoorNodeType).body as PoorNodeType[]
}

// parser specific
const unwrapExpressionStatement = (node: PoorNodeType) => {
  if (typeof node !== 'object') {
    return node
  }

  if (node.type === 'ExpressionStatement') {
    return node.expression as PoorNodeType
  }

  return node as PoorNodeType
}

// parser specific
const createBlockStatementNode = (body: PoorNodeType[]) => ({
  type: 'BlockStatement',
  body,
  directives: [], // whatever it is
})

// parser specific, rename to something that describes nodes are one-level wildcards
// can be internal variable of functions isWildcardNode and getWildcardFromNode
// on the other hand, it's needed to check if file node is an identifier node
export const IdentifierTypes = [
  'Identifier',
  'JSXIdentifier',
  'TSTypeParameter',
]

// parser specific, internal
const NodeConstructor = parse('').constructor //TODO: import proper constructor from somewhere

// parser specific
const isNode = (maybeNode: PoorNodeType) => {
  return maybeNode?.constructor === NodeConstructor
}

// parser specific, internal
const isNodeFieldOptional = (nodeType: string, nodeFieldKey: string) => {
  return Boolean(
    (NODE_FIELDS[nodeType] as { [key: string]: { optional: boolean } })[
      nodeFieldKey
    ]?.optional ?? true,
  )
}

// parser specific
const astPropsToSkip = [
  'loc',
  'start',
  'end',
  'extra',
  'trailingComments',
  'leadingComments',
  'tail', // Support for partial matching of template literals
]

// parser specific
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

// parser specific, group into wildcards
export const numericWildcard = '0x0'
// parser specific, group into wildcards
export const wildcardChar = '$'

// parser specific, group into wildcards, derived
export const optionalStringWildcardRegExp = new RegExp(
  `\\${wildcardChar}\\${wildcardChar}`,
  'g',
)
// parser specific, group into wildcards, derived
export const requiredStringWildcardRegExp = new RegExp(
  `\\${wildcardChar}\\${wildcardChar}\\${wildcardChar}`,
  'g',
)
// parser specific, group into wildcards, derived
export const anyStringWildcardRegExp = new RegExp(
  `(\\${wildcardChar}){2,3}`,
  'g',
)

// parser specific, group into wildcards, derived
export const identifierWildcard = wildcardChar + wildcardChar
// parser specific, group into wildcards, derived
export const nodesTreeWildcard = identifierWildcard + wildcardChar

// parser specific, group into wildcards, derived
export const disallowedWildcardRegExp = new RegExp(
  `(\\${wildcardChar}){4,}(?!\\{)`,
)

// parser specific, group into wildcards, derived
export const removeIdentifierRefFromWildcard = (name: string) => {
  const containsWildcardRegExp = new RegExp(`^\\${wildcardChar}`)
  const removeIdRefRegExp = new RegExp(`(?<=(\\${wildcardChar}){2,3})_(\\w)+$`)

  if (containsWildcardRegExp.test(name)) {
    return name.replace(removeIdRefRegExp, '')
  }

  return name
}

// Implement a functions isWildcardNode and getWildcardFromNode
// functions would check use IdentifierTypes and also other combinations
// This is what happens if you write code at 01:30 at Friday after intensive week
export const sortByLeastIdentifierStrength = (
  nodeA: PoorNodeType,
  nodeB: PoorNodeType,
) => {
  const aIsIdentifierWithWildcard =
    ['TSTypeReference', ...IdentifierTypes].includes(nodeA.type as string) &&
    (removeIdentifierRefFromWildcard(nodeA.name as string)?.includes(
      identifierWildcard,
    ) ||
      removeIdentifierRefFromWildcard(
        (nodeA as any)?.typeName?.name as string,
      )?.includes(identifierWildcard))
  const bIsIdentifierWithWildcard =
    ['TSTypeReference', ...IdentifierTypes].includes(nodeB.type as string) &&
    (removeIdentifierRefFromWildcard(nodeB.name as string)?.includes(
      identifierWildcard,
    ) ||
      removeIdentifierRefFromWildcard(
        (nodeB as any)?.typeName?.name as string,
      )?.includes(identifierWildcard))

  if (aIsIdentifierWithWildcard && bIsIdentifierWithWildcard) {
    const idA =
      removeIdentifierRefFromWildcard(nodeA.name as string) ||
      removeIdentifierRefFromWildcard((nodeA as any)?.typeName?.name as string)
    const idB =
      removeIdentifierRefFromWildcard(nodeB.name as string) ||
      removeIdentifierRefFromWildcard((nodeB as any)?.typeName?.name as string)

    if (idA === nodesTreeWildcard) {
      return 1
    }

    if (idB === nodesTreeWildcard) {
      return -1
    }

    const aNonWildcardCharsLen = idA
      .split(identifierWildcard)
      .map((str) => str.length)
      .reduce((sum, len) => sum + len, 0)
    const bNonWildcardCharsLen = idB
      .split(identifierWildcard)
      .map((str) => str.length)
      .reduce((sum, len) => sum + len, 0)

    return bNonWildcardCharsLen - aNonWildcardCharsLen
  }

  if (aIsIdentifierWithWildcard) {
    return 1
  }

  if (bIsIdentifierWithWildcard) {
    return -1
  }

  return 0
}

// parser specific, can be generic if wildcards are injected
export const patternToRegex = (str: string, caseInsensitive = false) => {
  if (disallowedWildcardRegExp.test(str)) {
    throw new Error(`More than 3 wildcards chars are not allowed "${str}"`)
  }

  const charsToEscape = str.match(nonIdentifierOrKeywordGlobal)
  let escapedString = str

  if (charsToEscape !== null) {
    const uniqueCharsToEscape = [...new Set(charsToEscape)]

    uniqueCharsToEscape.forEach((char) => {
      escapedString = escapedString.replace(
        new RegExp(`\\${char}`, 'g'),
        `\\${char}`,
      )
    })
  }

  const strWithReplacedWildcards = escapedString
    .replace(requiredStringWildcardRegExp, '.+?')
    .replace(optionalStringWildcardRegExp, '.*?')

  return new RegExp(
    `^${strWithReplacedWildcards}$`,
    caseInsensitive ? 'i' : undefined,
  )
}

export const babelParserSettings: ParserSettings = {
  parseCode,
  isNode,
  astPropsToSkip,
  isNodeFieldOptional,
  getProgramBodyFromRootNode,
  unwrapExpressionStatement,
  createBlockStatementNode,
  sanitizeNode,
  shouldCompareNode,
}
