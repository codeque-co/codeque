import { parse, ParserOptions, ParserPlugin } from '@babel/parser'
import { NODE_FIELDS } from '@babel/types'
import { ParserSettings, PoorNodeType } from './types'
import { normalizeText } from './utils'
import { createWildcardUtils } from './wildcardUtilsFactory'

const getProgramBodyFromRootNode = (fileNode: PoorNodeType) => {
  return (fileNode.program as PoorNodeType).body as PoorNodeType[]
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

const createBlockStatementNode = (body: PoorNodeType[]) => ({
  type: 'BlockStatement',
  body,
  directives: [], // whatever it is
})

// parser specific, rename to something that describes nodes are one-level wildcards

export const IdentifierTypes = [
  'Identifier',
  'JSXIdentifier',
  'TSTypeParameter',
]

const NodeConstructor = parse('').constructor //TODO: import proper constructor from somewhere

const isNode = (maybeNode: PoorNodeType) => {
  return maybeNode?.constructor === NodeConstructor
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

const numericWildcard = '0x0'
const wildcardChar = '$'

const wildcardUtils = createWildcardUtils(
  IdentifierTypes,
  numericWildcard,
  wildcardChar,
)

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
  wildcardUtils,
}
