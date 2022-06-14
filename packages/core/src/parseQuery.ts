import { parse, ParseError as BabelParseError } from '@babel/parser'
import {
  getBody,
  getKeysToCompare,
  IdentifierTypes,
  isNode,
  isNodeArray,
  numericWildcard,
  parseOptions,
  identifierWildcard,
  unwrapExpressionStatement,
  removeIdentifierRefFromWildcard,
  normalizeText,
  anyStringWildcardRegExp,
  SPACE_CHAR
} from './astUtils'
import { Hint, PoorNodeType, Position } from './types'
import { measureStart } from './utils'
import { wildcardChar, disallowedWildcardRegExp } from './astUtils'

const MIN_TOKEN_LEN = 2

const decomposeString = (str: string) =>
  str
    .split(anyStringWildcardRegExp)
    .map((part) => normalizeText(part).split(SPACE_CHAR))
    .flat(1)

const getUniqueTokens = (
  queryNode: PoorNodeType,
  caseInsensitive: boolean,
  tokens: Set<string> = new Set()
) => {
  if (IdentifierTypes.includes(queryNode.type as string)) {
    const trimmedWildcards = removeIdentifierRefFromWildcard(
      queryNode.name as string
    ).split(identifierWildcard)
    trimmedWildcards.forEach((part) => {
      if (part.length >= MIN_TOKEN_LEN) {
        tokens.add(caseInsensitive ? part.toLocaleLowerCase() : part)
      }
    })
  }

  if (
    (queryNode.type as string) === 'StringLiteral' ||
    (queryNode.type as string) === 'JSXText'
  ) {
    const trimmedWildcards = decomposeString(queryNode.value as string)

    trimmedWildcards.forEach((part) => {
      if (part.length >= MIN_TOKEN_LEN) {
        tokens.add(caseInsensitive ? part.toLocaleLowerCase() : part)
      }
    })
  }

  if ((queryNode.type as string) === 'TemplateElement') {
    const trimmedWildcards = decomposeString(
      (queryNode.value as { raw: string }).raw
    )

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

  const nodeKeys = getKeysToCompare(queryNode).filter(
    (key) =>
      isNode(queryNode[key] as PoorNodeType) ||
      isNodeArray(queryNode[key] as PoorNodeType[])
  )

  nodeKeys.forEach((key) => {
    const nodeVal = queryNode[key]
    if (isNodeArray(nodeVal as PoorNodeType[])) {
      ;(nodeVal as PoorNodeType[]).forEach((node) =>
        getUniqueTokens(node, caseInsensitive, tokens)
      )
    } else {
      getUniqueTokens(nodeVal as PoorNodeType, caseInsensitive, tokens)
    }
  })
  return tokens
}

const extractQueryNode = (fileNode: PoorNodeType) => {
  return unwrapExpressionStatement(getBody(fileNode)[0])
}

type ParseError = {
  text: string
  location?: Position
  code?: string
  reasonCode?: string
}

export type ParsedQuery = {
  queryNode: PoorNodeType
  uniqueTokens: string[]
  hints: Hint[]
  error: ParseError | null
}

const getHints = (queryCode: string, error?: ParseError | null) => {
  const hints: Hint[] = []
  if (queryCode.startsWith('{')) {
    const info = 'To look for object, add expression brackets'
    const code = '({ key:val })'
    hints.push({
      text: `${info} ${code}`,
      tokens: [
        { type: 'text', content: info },
        { type: 'code', content: code }
      ]
    })
  }

  if (
    error &&
    (queryCode.startsWith("'") || queryCode.startsWith('"')) &&
    (error.text.includes('Unterminated string constant') ||
      error.text.includes('Empty query'))
  ) {
    const info = 'To look for string, add expression brackets'
    const code = "('some string')"
    hints.push({
      text: `${info} ${code}`,
      tokens: [
        { type: 'text', content: info },
        { type: 'code', content: code }
      ]
    })
  }

  return hints
}

export const parseQueries = (
  queryCodes: string[],
  caseInsensitive: boolean
): [Array<ParsedQuery>, boolean] => {
  const inputQueryNodes = queryCodes
    .map((queryText) => {
      let originalError = null
      if (disallowedWildcardRegExp.test(queryText)) {
        const lines = queryText.split('\n')
        let lineIdx: number | null = null
        let colNum: number | null = null

        lines.forEach((line, idx) => {
          const col = line.indexOf(wildcardChar.repeat(4))
          if (colNum === null && col > -1) {
            lineIdx = idx
            colNum = col + 1
          }
        })
        return {
          queryNode: {},
          error: {
            text: 'More than three wildcard chars are not allowed',
            ...(colNum !== null && lineIdx !== null
              ? {
                  location: {
                    line: lineIdx + 1,
                    column: colNum
                  }
                }
              : {})
          }
        }
      }

      try {
        const parsedAsIs = parse(
          queryText,
          parseOptions
        ) as unknown as PoorNodeType
        return {
          queryNode: extractQueryNode(parsedAsIs),
          error: null
        }
      } catch (e) {
        const error = e as BabelParseError & { loc: Position; message: string }

        originalError = {
          text: error.message,
          location: error.loc,
          code: error.code,
          reasonCode: error.reasonCode
        }
      }

      try {
        const parsedAsExp = parse(
          `(${queryText})`,
          parseOptions
        ) as unknown as PoorNodeType
        return {
          queryNode: extractQueryNode(parsedAsExp),
          error: null
        }
      } catch (e) {
        return {
          queryNode: {},
          error: originalError
        }
      }
    })
    .map(({ error, queryNode }) => ({
      queryNode,
      error: !queryNode ? { text: 'Empty query!' } : error
    }))

  const queries = inputQueryNodes.map(({ queryNode, error }, i) => {
    const measureGetUniqueTokens = measureStart('getUniqueTokens')

    const uniqueTokens = queryNode
      ? [...getUniqueTokens(queryNode, caseInsensitive)].filter(
          (token) => typeof token !== 'string' || token.length > 0
        )
      : []

    measureGetUniqueTokens()

    const hints = getHints(queryCodes[i], error)

    return {
      hints,
      queryNode,
      uniqueTokens,
      error
    }
  })

  return [queries, queries.filter(({ error }) => error !== null).length === 0]
}
