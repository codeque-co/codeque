import {
  Hint,
  ParsedQuery,
  ParseError,
  ParserSettings,
  PoorNodeType,
  Position,
} from './types'
import { measureStart, SPACE_CHAR, normalizeText } from './utils'
import { isNodeArray, getKeysToCompare } from './astUtils'

const MIN_TOKEN_LEN = 2

const decomposeString = (str: string, anyStringWildcardRegExp: RegExp) =>
  str
    .split(anyStringWildcardRegExp)
    .map((part) => normalizeText(part).split(SPACE_CHAR))
    .flat(1)

const getUniqueTokens = (
  queryNode: PoorNodeType,
  caseInsensitive: boolean,
  parserSettings: ParserSettings,
  tokens: Set<string> = new Set(),
) => {
  const { anyStringWildcardRegExp } = parserSettings.wildcardUtils

  if (parserSettings.isIdentifierNode(queryNode)) {
    const trimmedWildcards = parserSettings.wildcardUtils
      .removeIdentifierRefFromWildcard(queryNode.name as string)
      .split(parserSettings.wildcardUtils.identifierWildcard)

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
    const trimmedWildcards = decomposeString(
      queryNode.value as string,
      anyStringWildcardRegExp,
    )

    trimmedWildcards.forEach((part) => {
      if (part.length >= MIN_TOKEN_LEN) {
        tokens.add(caseInsensitive ? part.toLocaleLowerCase() : part)
      }
    })
  }

  if ((queryNode.type as string) === 'TemplateElement') {
    const trimmedWildcards = decomposeString(
      (queryNode.value as { raw: string }).raw,
      anyStringWildcardRegExp,
    )

    trimmedWildcards.forEach((part) => {
      if (part.length >= MIN_TOKEN_LEN) {
        tokens.add(caseInsensitive ? part.toLocaleLowerCase() : part)
      }
    })
  }

  if ((queryNode.type as string) === 'NumericLiteral') {
    const raw = (queryNode.extra as any).raw as string

    if (raw !== parserSettings.wildcardUtils.numericWildcard) {
      tokens.add(raw)
    }
  }

  const nodeKeys = getKeysToCompare(
    queryNode,
    parserSettings.astPropsToSkip,
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

const extractQueryNode = (
  fileNode: PoorNodeType,
  parserSettings: ParserSettings,
) => {
  const queryBody = parserSettings.getProgramBodyFromRootNode(fileNode)

  if (queryBody.length === 1) {
    return {
      queryNode: parserSettings.unwrapExpressionStatement(queryBody[0]),
      isMultistatement: false,
    }
  }

  return {
    queryNode: parserSettings.createBlockStatementNode(queryBody),
    isMultistatement: true,
  }
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

      try {
        const parsedAsIs = parserSettings.parseCode(queryText)

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
          location: error.loc,
          code: error.code,
          reasonCode: error.reasonCode,
        }
      }

      try {
        const parsedAsExp = parserSettings.parseCode(
          `(${queryText})`,
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
