import { parse, ParserOptions } from '@babel/parser'
// import omit from 'object.omit';

export type Position = {
  line: number, column: number
}

export type Match = {
  start: Position,
  end: Position,
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

export const parseOptions = { sourceType: 'module', plugins: ['typescript', 'jsx', 'decorators-legacy'] } as ParserOptions

const omit = (obj: Record<string, unknown>, keys: string[]) => {
  const newObj = {} as Record<string, unknown>

  Object.entries(obj).forEach(([key, val]) => {
    if (!keys.includes(key)) {
      newObj[key] = val
    }
  })

  return newObj
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

      cleanedAst[key] = (cleanedAst[key] as PoorNodeType[]).map((subAst) => cleanupAst(subAst))
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