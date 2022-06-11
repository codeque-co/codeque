import { parse, ParserOptions } from '@babel/parser'
// import omit from 'object.omit';
// import { wasmFns } from './wasm'
import { NODE_FIELDS } from '@babel/types'

export type Position = {
  line: number
  column: number
}

export type Match = {
  start: number
  end: number
  loc: {
    start: Position
    end: Position
  }
  code: string
  query: string
}

export type PoorNodeType = {
  [key: string]: string | number | boolean | PoorNodeType[] | PoorNodeType
}

export const getBody = (fileNode: PoorNodeType) => {
  return (fileNode.program as PoorNodeType).body as PoorNodeType[]
}

export const unwrapExpressionStatement = (node: PoorNodeType) => {
  if (typeof node !== 'object') {
    return node
  }

  if (node.type === 'ExpressionStatement') {
    return node.expression as PoorNodeType
  }

  return node as PoorNodeType
}

export const astPropsToSkip = [
  'loc',
  'start',
  'end',
  'extra',
  'trailingComments',
  'leadingComments'
]
export const IdentifierTypes = [
  'Identifier',
  'JSXIdentifier',
  'TSTypeParameter'
]

export const NodeConstructor = parse('').constructor //TODO: import proper constructor from somewhere

export const isNode = (maybeNode: PoorNodeType) => {
  return maybeNode?.constructor === NodeConstructor
}

export const isNodeArray = (maybeNodeArr: PoorNodeType[]) => {
  return (
    Array.isArray(maybeNodeArr) &&
    maybeNodeArr.length > 0 &&
    isNode(maybeNodeArr[0])
  )
}

const isNullOrUndef = (val: any) => val === null || val === undefined

const isNodeFieldOptional = (nodeType: string, nodeFieldKey: string) => {
  return Boolean(
    (NODE_FIELDS[nodeType] as { [key: string]: { optional: boolean } })[
      nodeFieldKey
    ]?.optional ?? true
  )
}

export const getKeysToCompare = (node: PoorNodeType) => {
  return Object.keys(node).filter((key) => !astPropsToSkip.includes(key))
}

export const getSetsOfKeysToCompare = (
  fileNode: PoorNodeType,
  queryNode: PoorNodeType,
  isExact: boolean
) => {
  const exactFileKeys = getKeysToCompare(fileNode)
  const exactQueryKeys = getKeysToCompare(queryNode)

  if (isExact || fileNode.type !== queryNode.type) {
    return [exactFileKeys, exactQueryKeys]
  }

  /**
   *  If in include mode and file and query nodes are of the same type
   *    Exclude from file node all properties that
   *    - are not present on query node or their value is falsy on query node (not specified)
   *    - and are marked as optional in babel types
   */

  const fileKeysToRemove = exactFileKeys.filter(
    (fileKey) =>
      (!exactQueryKeys.includes(fileKey) ||
        isNullOrUndef(queryNode[fileKey])) &&
      isNodeFieldOptional(fileNode.type as string, fileKey)
  )

  const includeFileKeys = exactFileKeys.filter(
    (fileKey) => !fileKeysToRemove.includes(fileKey)
  )

  // exclude all properties that has falsy value (otherwise properties set does not mach, if we remove these properties from file node)
  const includeQueryKeys = exactQueryKeys.filter(
    (queryKey) =>
      !fileKeysToRemove.includes(queryKey) &&
      !isNullOrUndef(queryNode[queryKey])
  )

  return [includeFileKeys, includeQueryKeys]
}

export const SPACE_CHAR = ' '

export const normalizeText = (text: string) =>
  text.trim().replace(/\s+/g, SPACE_CHAR)

export const sanitizeJSXText = (node: PoorNodeType) => {
  // wasmFns.trim_value(node)
  //@ts-ignore
  node.value = normalizeText(node.value)
  //@ts-ignore
  node.extra.raw = normalizeText(node.extra.raw)
  //@ts-ignore
  node.extra.rawValue = normalizeText(node.extra.rawValue)
}

export const parseOptions = {
  sourceType: 'module',
  plugins: ['typescript', 'jsx', 'decorators-legacy'],
  allowReturnOutsideFunction: true
} as ParserOptions

const omit = (obj: Record<string, unknown>, keys: string[]) => {
  const newObj = {} as Record<string, unknown>

  Object.entries(obj).forEach(([key, val]) => {
    if (!keys.includes(key)) {
      newObj[key] = val
    }
  })

  return newObj
}

export const shouldCompareNode = (node: PoorNodeType) => {
  if (node.type === 'JSXText') {
    sanitizeJSXText(node)
    return (node.value as string).length > 0
  }

  return true
}

export const cleanupAst = (ast: PoorNodeType) => {
  if (ast.type === 'JSXText') {
    sanitizeJSXText(ast)
  }

  const cleanedAst = omit(ast, astPropsToSkip) as PoorNodeType

  Object.keys(cleanedAst).forEach((key) => {
    if (isNode(cleanedAst[key] as PoorNodeType)) {
      cleanedAst[key] = cleanupAst(cleanedAst[key] as PoorNodeType)
    }
    if (isNodeArray(cleanedAst[key] as PoorNodeType[])) {
      cleanedAst[key] = (cleanedAst[key] as PoorNodeType[])
        .filter(shouldCompareNode)
        .map((subAst) => cleanupAst(subAst))
    }
  })

  return cleanedAst
}

export const compareCode = (codeA: string, codeB: string) => {
  const astA = parse(codeA, parseOptions).program as unknown as PoorNodeType
  const astB = parse(codeB, parseOptions).program as unknown as PoorNodeType

  const cleanedA = cleanupAst(astA)
  const cleanedB = cleanupAst(astB)

  return JSON.stringify(cleanedA) === JSON.stringify(cleanedB)
}

export const numericWildcard = '0x0'
export const wildcardChar = '$'

export const optionalStringWildcardRegExp = new RegExp(
  `\\${wildcardChar}\\${wildcardChar}`,
  'g'
)
export const requiredStringWildcardRegExp = new RegExp(
  `\\${wildcardChar}\\${wildcardChar}\\${wildcardChar}`,
  'g'
)
export const anyStringWildcardRegExp = new RegExp(
  `(\\${wildcardChar}){2,3}`,
  'g'
)

export const identifierWildcard = wildcardChar + wildcardChar
export const nodesTreeWildcard = identifierWildcard + wildcardChar

export const disallowedWildcardRegExp = new RegExp(`(\\${wildcardChar}){4,}`)

export const removeIdentifierRefFromWildcard = (name: string) => {
  const containsWildcardRegExp = new RegExp(`^\\${wildcardChar}`)
  const removeIdRefRegExp = new RegExp(`(?<=(\\${wildcardChar}){2,3})_.*`)
  if (containsWildcardRegExp.test(name)) {
    return name.replace(removeIdRefRegExp, '')
  }
  return name
}

// This is what happens if you write code at 01:30 at Friday after intensive week
export const sortByLeastIdentifierStrength = (
  nodeA: PoorNodeType,
  nodeB: PoorNodeType
) => {
  const aIsIdentifierWithWildcard =
    ['TSTypeReference', ...IdentifierTypes].includes(nodeA.type as string) &&
    (removeIdentifierRefFromWildcard(nodeA.name as string)?.includes(
      identifierWildcard
    ) ||
      removeIdentifierRefFromWildcard(
        (nodeA as any)?.typeName?.name as string
      )?.includes(identifierWildcard))
  const bIsIdentifierWithWildcard =
    ['TSTypeReference', ...IdentifierTypes].includes(nodeB.type as string) &&
    (removeIdentifierRefFromWildcard(nodeB.name as string)?.includes(
      identifierWildcard
    ) ||
      removeIdentifierRefFromWildcard(
        (nodeB as any)?.typeName?.name as string
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

export const prepareCodeResult = ({
  fileContent,
  start,
  end,
  loc
}: { fileContent: string } & Omit<Match, 'code' | 'query'>) => {
  const frame = fileContent.substring(start - loc.start.column, end)
  const firstLineWhiteCharsCountRegExp = new RegExp(`^\\s*`)

  const firstLine = frame.split('\n')[0]
  const lines = frame.substr(loc.start.column).split('\n')
  const firstLineWhiteCharsCount = (
    firstLine?.match(firstLineWhiteCharsCountRegExp) as [string]
  )[0]?.length

  const replaceRegex = new RegExp(`^\\s{0,${firstLineWhiteCharsCount}}`)

  if (firstLineWhiteCharsCount > 0) {
    return lines.map((line) => line.replace(replaceRegex, '')).join('\n')
  }

  return lines.join('\n')
}
