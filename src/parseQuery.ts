import { parse, ParseError } from '@babel/parser'
import {
  getBody, getKeysToCompare, IdentifierTypes, isNode,
  isNodeArray, numericWildcard, parseOptions, PoorNodeType,
  Position, singleIdentifierWildcard, unwrapExpressionStatement, stringWildcard
} from './astUtils'
import { measureStart } from './utils'

const MIN_TOKEN_LEN = 2

const getUniqueTokens = (queryNode: PoorNodeType, caseInsensitive = false, tokens: Set<string> = new Set()) => {
  if (IdentifierTypes.includes(queryNode.type as string)) {
    const trimmedWildcards = (queryNode.name as string).split(singleIdentifierWildcard)
    trimmedWildcards.forEach((part) => {
      if (part.length >= MIN_TOKEN_LEN) {
        tokens.add(caseInsensitive ? part.toLocaleLowerCase() : part)
      }
    })
  }

  if ((queryNode.type as string) === 'StringLiteral') {
    const trimmedWildcards = (queryNode.value as string).split(stringWildcard)
    trimmedWildcards.forEach((part) => {
      if (part.length >= MIN_TOKEN_LEN) {
        tokens.add(caseInsensitive ? part.toLocaleLowerCase() : part)
      }
    })
  }

  if ((queryNode.type as string) === 'JSXText') {
    const trimmedWildcards = (queryNode.value as string).split(stringWildcard)
    trimmedWildcards.forEach((part) => {
      if (part.length >= MIN_TOKEN_LEN) {
        tokens.add(caseInsensitive ? part.toLocaleLowerCase() : part)
      }
    })
  }

  if ((queryNode.type as string) === 'NumericLiteral') {
    const raw = (queryNode.extra as any).raw as string
    if (raw !== numericWildcard) {
      tokens.add(raw)
    }
  }

  const nodeKeys = getKeysToCompare(queryNode).filter((key) =>
    isNode(queryNode[key] as PoorNodeType) || isNodeArray(queryNode[key] as PoorNodeType[])
  )

  nodeKeys.forEach((key) => {
    const nodeVal = queryNode[key]
    if (isNodeArray(nodeVal as PoorNodeType[])) {
      (nodeVal as PoorNodeType[]).forEach((node) => getUniqueTokens(node, caseInsensitive, tokens))
    }
    else {
      getUniqueTokens(nodeVal as PoorNodeType, caseInsensitive, tokens)
    }
  })
  return tokens
}

const extractQueryNode = (fileNode: PoorNodeType) => {
  return unwrapExpressionStatement(getBody(fileNode)[0])
}

export const parseQueries = (queryCodes: string[], caseInsensitive = false): [Array<{
  queryNode: PoorNodeType,
  uniqueTokens: string[],
  error: { text: string, location?: any } | null
}>, boolean] => {
  const inputQueryNodes = queryCodes.map((queryText) => {
    let originalError = null
    try {
      const parsedAsIs = parse(queryText, parseOptions) as unknown as PoorNodeType
      return {
        queryNode: extractQueryNode(parsedAsIs),
        error: null
      }
    }
    catch (e) {
      const error = e as ParseError & { loc: Position, message: string }

      originalError = {
        text: error.message,
        location: error.loc,
        code: error.code,
        reasonCode: error.reasonCode
      }
    }

    try {
      const parsedAsExp = parse(`(${queryText})`, parseOptions) as unknown as PoorNodeType
      return {
        queryNode: extractQueryNode(parsedAsExp),
        error: null
      }
    }
    catch (e) {
      return {
        queryNode: {},
        error: originalError
      }
    }
  })
    .map(({ error, queryNode }) => ({
      queryNode,
      error: !Boolean(queryNode) ? { text: 'Empty query!' } : error
    }))


  const queries = inputQueryNodes.map(({ queryNode, error }) => {
    const measureGetUniqueTokens = measureStart('getUniqueTokens')

    const uniqueTokens = queryNode ? [...getUniqueTokens(queryNode, caseInsensitive)].filter((token) => typeof token !== 'string' || token.length > 0) : []

    measureGetUniqueTokens()

    return {
      queryNode,
      uniqueTokens,
      error
    }
  })

  return [queries, queries.filter(({ error }) => error !== null).length === 0]
}