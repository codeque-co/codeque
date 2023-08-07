import {
  Hint,
  ParsedQuery,
  ParseError,
  ParserSettings,
  PoorNodeType,
  Position,
} from './types'
import { measureStart, decomposeString } from './utils'
import { isNodeArray, getKeysToCompare } from './astUtils'

const MIN_TOKEN_LEN = 2

const defaultGetUniqueTokensFromStringOrIdentifierNode = ({
  queryNode,
  caseInsensitive,
  parserSettings,
}: {
  queryNode: PoorNodeType
  caseInsensitive: boolean
  parserSettings: Pick<
    ParserSettings,
    | 'isIdentifierNode'
    | 'stringLikeLiteralUtils'
    | 'getIdentifierNodeName'
    | 'wildcardUtils'
  >
}) => {
  const { stringLikeLiteralUtils, getIdentifierNodeName } = parserSettings
  const { anyStringWildcardRegExp } = parserSettings.wildcardUtils
  const tokens: string[] = []

  if (parserSettings.isIdentifierNode(queryNode)) {
    const trimmedWildcards = parserSettings.wildcardUtils
      .removeWildcardAliasesFromIdentifierName(getIdentifierNodeName(queryNode))
      .split(parserSettings.wildcardUtils.identifierWildcard)

    trimmedWildcards.forEach((part) => {
      if (part.length >= MIN_TOKEN_LEN) {
        tokens.push(caseInsensitive ? part.toLocaleLowerCase() : part)
      }
    })
  }

  if (stringLikeLiteralUtils.isStringLikeLiteralNode(queryNode)) {
    const stringContent =
      parserSettings.wildcardUtils.removeWildcardAliasesFromStringLiteral(
        stringLikeLiteralUtils.getStringLikeLiteralValue(queryNode),
      )

    const trimmedWildcards = decomposeString(
      stringContent,
      anyStringWildcardRegExp,
    )

    trimmedWildcards.forEach((part) => {
      if (part.length >= MIN_TOKEN_LEN) {
        tokens.push(caseInsensitive ? part.toLocaleLowerCase() : part)
      }
    })
  }

  return tokens
}

export const getUniqueTokens = (
  queryNode: PoorNodeType,
  caseInsensitive: boolean,
  parserSettings: ParserSettings,
  tokens: Set<string> = new Set(),
) => {
  const { numericLiteralUtils, getUniqueTokensFromStringOrIdentifierNode } =
    parserSettings

  const getUniqueTokensFn =
    getUniqueTokensFromStringOrIdentifierNode ??
    defaultGetUniqueTokensFromStringOrIdentifierNode

  const tokensFromStringsOrIdNode = getUniqueTokensFn({
    queryNode,
    caseInsensitive,
    parserSettings,
  })

  tokensFromStringsOrIdNode.forEach(tokens.add, tokens)

  if (numericLiteralUtils.isNumericLiteralNode(queryNode)) {
    const raw = numericLiteralUtils.getNumericLiteralValue(queryNode)

    if (raw !== parserSettings.wildcardUtils.numericWildcard) {
      tokens.add(caseInsensitive ? raw.toLocaleLowerCase() : raw)
    }
  }

  const nodeKeys = getKeysToCompare(
    queryNode,
    parserSettings.astPropsToSkip,
    parserSettings.getNodeType,
  ).filter(
    (key) =>
      parserSettings.isNode(queryNode[key] as PoorNodeType) ||
      isNodeArray(queryNode[key] as PoorNodeType[], parserSettings.isNode),
  )

  nodeKeys.forEach((key) => {
    const nodeVal = queryNode[key]

    if (isNodeArray(nodeVal as PoorNodeType[], parserSettings.isNode)) {
      const _nodeVal = nodeVal as PoorNodeType[]

      _nodeVal.forEach((node) =>
        getUniqueTokens(node, caseInsensitive, parserSettings, tokens),
      )
    } else {
      getUniqueTokens(
        nodeVal as PoorNodeType,
        caseInsensitive,
        parserSettings,
        tokens,
      )
    }
  })

  return tokens
}

export const extractQueryNode = (
  topLevelQueryNode: PoorNodeType,
  parserSettings: ParserSettings,
) => {
  const queryBody = parserSettings.getProgramBodyFromRootNode(topLevelQueryNode)

  if (queryBody.length === 0) {
    throw new Error('Query is empty or code was not parsed correctly')
  }

  if (queryBody.length === 1) {
    return {
      queryNode: parserSettings.unwrapExpressionStatement(queryBody[0]),
      isMultistatement: false,
    }
  }

  const position = parserSettings.getNodePosition(topLevelQueryNode)

  return {
    queryNode: parserSettings.createBlockStatementNode(queryBody, position),
    isMultistatement: true,
  }
}

export const getHints = (queryCode: string, error?: ParseError | null) => {
  const hints: Hint[] = []

  if (queryCode.startsWith('{')) {
    const info = 'To look for object, add expression brackets'
    const code = '({ key:val })'

    hints.push({
      text: `${info} ${code}`,
      tokens: [
        { type: 'text', content: info },
        { type: 'code', content: code },
      ],
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
        { type: 'code', content: code },
      ],
    })
  }

  return hints
}

export const parseQueries = (
  queryCodes: string[],
  caseInsensitive: boolean,
  parserSettings: ParserSettings,
): [Array<ParsedQuery>, boolean] => {
  const inputQueryNodes = queryCodes
    .map((queryText) => {
      let originalError = null

      if (
        parserSettings.wildcardUtils.disallowedWildcardRegExp.test(queryText)
      ) {
        const lines = queryText.split('\n')
        let lineIdx: number | null = null
        let colNum: number | null = null

        lines.forEach((line, idx) => {
          const col = line.indexOf(
            parserSettings.wildcardUtils.disallowedWildcardSequence,
          )

          if (colNum === null && col > -1) {
            lineIdx = idx
            colNum = col + 1
          }
        })

        return {
          queryNode: {},
          isMultistatement: false,
          error: {
            text: 'More than three wildcard chars are not allowed',
            ...(colNum !== null && lineIdx !== null
              ? {
                  location: {
                    line: lineIdx + 1,
                    column: colNum,
                  },
                }
              : {}),
          },
        }
      }

      if (queryText.trim().length === 0) {
        return {
          queryNode: null,
          error: { text: 'Empty query!' },
          isMultistatement: false,
        }
      }

      const preprocessedQueryCode =
        parserSettings.preprocessQueryCode?.(queryText) ?? queryText

      try {
        const parsedAsIs = parserSettings.parseCode(
          preprocessedQueryCode.trim(),
        )

        const { queryNode, isMultistatement } = extractQueryNode(
          parsedAsIs,
          parserSettings,
        )

        return {
          queryNode,
          isMultistatement,
          error: null,
        }
      } catch (e) {
        const error = e as {
          code?: string
          reasonCode?: string
          loc?: Position
          message: string
        }

        originalError = {
          text: error.message,
          location: parserSettings.getParseErrorLocation(error as Error),
          code: error.code,
          reasonCode: error.reasonCode,
        }
      }

      try {
        const parsedAsExp = parserSettings.parseCode(
          `(${preprocessedQueryCode})`,
        ) as unknown as PoorNodeType

        const { queryNode } = extractQueryNode(parsedAsExp, parserSettings)

        return {
          queryNode,
          isMultistatement: false, // single expression cannot be multistatement
          error: null,
        }
      } catch (e) {
        return {
          queryNode: {},
          isMultistatement: false,
          error: originalError,
        }
      }
    })
    .map(({ error, queryNode, isMultistatement }) => ({
      queryNode:
        (queryNode && parserSettings.postprocessQueryNode?.(queryNode)) ??
        queryNode,
      error: !queryNode ? { text: 'Empty query!' } : error,
      isMultistatement,
    }))

  const queries = inputQueryNodes.map(
    ({ queryNode, error, isMultistatement }, i) => {
      const measureGetUniqueTokens = measureStart('getUniqueTokens')

      const uniqueTokens = queryNode
        ? [
            ...getUniqueTokens(queryNode, caseInsensitive, parserSettings),
          ].filter((token) => typeof token !== 'string' || token.length > 0)
        : []

      measureGetUniqueTokens()

      const queryCode = queryCodes[i]
      const hints = getHints(queryCode, error)

      return {
        hints,
        queryNode,
        queryCode,
        uniqueTokens,
        error,
        isMultistatement,
      }
    },
  )

  return [queries, queries.filter(({ error }) => error !== null).length === 0]
}
