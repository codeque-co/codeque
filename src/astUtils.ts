import { parse, ParserOptions } from '@babel/parser'
// import omit from 'object.omit';

export type Position = {
  line: number, column: number
}

export type Match = {
  start: number,
  end: number,
  loc: {
    start: Position,
    end: Position,
  },
  code: string
  query: string
}

export type PoorNodeType = {
  [key: string]: string | number | PoorNodeType[] | PoorNodeType
}

export const getBody = (fileNode: PoorNodeType) => {
  return (fileNode.program as PoorNodeType).body as PoorNodeType[]
}

export const unwrapExpressionStatement = (node: PoorNodeType) => {
  if (typeof node !== "object") {
    return node
  }

  if (node.type === 'ExpressionStatement') {
    return node.expression as PoorNodeType
  }

  return node as PoorNodeType
}

export const astPropsToSkip = ['loc', 'start', 'end', 'extra', 'trailingComments', 'leadingComments']
export const IdentifierTypes = ['Identifier', 'JSXIdentifier']

export const NodeConstructor = parse('').constructor //TODO: import proper constructor from somewhere

export const isNode = (maybeNode: PoorNodeType) => {
  return maybeNode?.constructor === NodeConstructor
}

export const isNodeArray = (maybeNodeArr: PoorNodeType[]) => {
  return Array.isArray(maybeNodeArr) && maybeNodeArr.length > 0 && isNode(maybeNodeArr[0])
}


export const getKeysToCompare = (node: PoorNodeType) => {
  return Object.keys(node).filter((key) => !astPropsToSkip.includes(key))
}

export const sanitizeJSXText = (node: PoorNodeType) => {
  //@ts-ignore
  node.value = node.value?.trim()
  //@ts-ignore
  node.extra.raw = node.extra.raw?.trim()
  //@ts-ignore
  node.extra.rawValue = node.extra.rawValue?.trim()
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

      cleanedAst[key] = (cleanedAst[key] as PoorNodeType[]).filter(shouldCompareNode).map((subAst) => cleanupAst(subAst))
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
export const wildcard = '$'
export const stringWildcard = wildcard
export const singleIdentifierWildcard = wildcard
export const doubleIdentifierWildcard = `${singleIdentifierWildcard}${singleIdentifierWildcard}`

export const removeIdentifierRefFromWildcard = (name: string) => {
  if (/^\$/.test(name)) {
    return name.replace(/(?<=(\$){1,2})_.*/, '')
  }
  return name
}

// This is what happens if you write code at 01:30 at Friday after intensive week 
export const sortByLeastIdentifierStrength = (nodeA: PoorNodeType, nodeB: PoorNodeType) => {
  const aIsIdentifierWithWildcard = ['TSTypeReference', ...IdentifierTypes]
    .includes(nodeA.type as string) && (
      removeIdentifierRefFromWildcard(nodeA.name as string)?.includes(singleIdentifierWildcard)
      || removeIdentifierRefFromWildcard((nodeA as any)?.typeName?.name as string)?.includes(singleIdentifierWildcard)
    )
  const bIsIdentifierWithWildcard = ['TSTypeReference', ...IdentifierTypes]
    .includes(nodeB.type as string) && (
      removeIdentifierRefFromWildcard(nodeB.name as string)?.includes(singleIdentifierWildcard)
      || removeIdentifierRefFromWildcard((nodeB as any)?.typeName?.name as string)?.includes(singleIdentifierWildcard)
    )

  if (aIsIdentifierWithWildcard && bIsIdentifierWithWildcard) {
    const idA = removeIdentifierRefFromWildcard(nodeA.name as string) || removeIdentifierRefFromWildcard((nodeA as any)?.typeName?.name as string)
    const idB = removeIdentifierRefFromWildcard(nodeB.name as string) || removeIdentifierRefFromWildcard((nodeB as any)?.typeName?.name as string)

    if (idA === doubleIdentifierWildcard) {
      return 1
    }

    if (idB === doubleIdentifierWildcard) {
      return -1
    }

    const aNonWildcardCharsLen = idA.split(singleIdentifierWildcard).map((str) => str.length).reduce((sum, len) => sum + len, 0)
    const bNonWildcardCharsLen = idB.split(singleIdentifierWildcard).map((str) => str.length).reduce((sum, len) => sum + len, 0)

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

export const prepareCodeResult = ({ fileContent, start, end, loc }: { fileContent: string } & Omit<Match, 'code' | 'query'>) => {
  const frame = fileContent.substring(start - loc.start.column, end)
  const firstLineWhiteCharsCountRegExp = new RegExp(`^\\s*`)

  const firstLine = frame.split('\n')[0]
  const lines = frame.substr(loc.start.column).split('\n')
  const firstLineWhiteCharsCount = (firstLine?.match(firstLineWhiteCharsCountRegExp) as [string])[0]?.length

  const replaceRegex = new RegExp(`^\\s{0,${firstLineWhiteCharsCount}}`)

  if (firstLineWhiteCharsCount > 0) {
    return lines.map((line) => line.replace(replaceRegex, '')).join('\n')
  }

  return lines.join('\n')
}