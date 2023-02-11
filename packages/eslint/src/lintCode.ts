import { Rule } from 'eslint'
import {
  Mode,
  parseQueries,
  __internal,
  NotNullParsedQuery,
  PoorNodeType,
} from '@codeque/core'
import { formatQueryParseErrors } from './utils'

/**
 * TODO: To verify if new approach traversal work correct, we can change implementation of traversal in main search and run tests
 */

type ParsedQueryWithSettings = {
  parsedQuery: NotNullParsedQuery
  mode: Mode
  caseInsensitive: boolean
  message: string
}

export const createLintCode = (type: Rule.RuleMetaData['type']) => ({
  meta: {
    type: type,
    docs: {
      description: 'Lints anything based on code sample(s).',
    },
    fixable: 'code',
    schema: [
      {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            mode: {
              type: 'string',
            },
            query: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
            caseInsensitive: {
              type: 'boolean',
            },
            // todo: file filters, sensitivity, alternative file path for query etc.
          },
        },
      },
    ],
  },
  create: function (context: Rule.RuleContext) {
    // console.log('Hello World')
    const settings = context.options[0] as
      | Array<{
          mode?: Mode
          query?: string
          message?: string
          caseInsensitive?: boolean
        }>
      | undefined

    if (!settings || settings.length === 0) {
      return
    }

    const defaultCaseInsensitive = true
    const queryCodes = settings.map(({ query }) => query)

    if (queryCodes.includes(undefined) || queryCodes.includes(null as any)) {
      throw new Error('Each setting has to have at least query defined.')
    }

    const parserSettings = __internal.parserSettingsMap['typescript-eslint']()

    const queriesParseResult = settings.map(({ query, caseInsensitive }) =>
      parseQueries(
        [query] as string[],
        caseInsensitive ?? defaultCaseInsensitive,
        parserSettings,
      ),
    )

    const queriesNotParsedCorrectly = queriesParseResult.filter(
      ([_, parseOk]) => !parseOk,
    )

    if (queriesNotParsedCorrectly.length > 0) {
      throw new Error(formatQueryParseErrors(queriesNotParsedCorrectly))
    }

    const parsedQueries = queriesParseResult.map(
      ([[parsedQuery]]) => parsedQuery,
    )

    const parsedQueriesWithSettings = parsedQueries.map((parsedQuery, idx) => ({
      parsedQuery: parsedQuery as NotNullParsedQuery,
      mode: settings[idx].mode ?? 'include',
      caseInsensitive: settings[idx].caseInsensitive ?? defaultCaseInsensitive,
      message: settings[idx].message ?? 'Restricted code pattern',
    })) as ParsedQueryWithSettings[]

    const code = context.getSourceCode().text

    const queriesWithSettingsMatchedShallow = parsedQueriesWithSettings.filter(
      (parsedQuery) => {
        return __internal.shallowSearch({
          queries: [parsedQuery.parsedQuery] as NotNullParsedQuery[],
          fileContent: code,
          logger: {} as any,
          caseInsensitive: parsedQuery.caseInsensitive,
        })
      },
    ) as ParsedQueryWithSettings[]

    if (queriesWithSettingsMatchedShallow.length === 0) {
      // console.log('shallow not match')
      return {}
    }

    const queryCodesGroupedByStartingNode =
      queriesWithSettingsMatchedShallow.reduce((map, query) => {
        const nodeType = query.parsedQuery.queryNode.type as string

        if (!map[nodeType]) {
          map[nodeType] = []
        }

        map[nodeType].push(query)

        return map
      }, {} as Record<string, ParsedQueryWithSettings[]>)

    const createSearchForNode =
      (parsedQueries: ParsedQueryWithSettings[]) => (node: PoorNodeType) => {
        // console.log('searchOptions', searchOptions)
        for (const queryWithSettings of parsedQueries) {
          const searchOptions = {
            mode: queryWithSettings.mode,
            // TODO: should this be parametrised ? yes, for other like vue it will have to be
            parserSettings,
            debug: false,
            caseInsensitive: queryWithSettings.caseInsensitive,
          }
          const match = __internal.validateMatch(
            node,
            queryWithSettings.parsedQuery.queryNode,
            searchOptions,
          )

          if (match) {
            const matchData = __internal.getMatchFromNode(node, parserSettings)

            context.report({
              loc: matchData.loc,
              message: queryWithSettings.message,
            })
          }
        }
      }

    const visitors = Object.entries(queryCodesGroupedByStartingNode)
      .map(([node, queries]) => ({
        [node]: createSearchForNode(queries),
      }))
      .reduce(
        (visitorsMap, visitorObj) => ({
          ...visitorsMap,
          ...visitorObj,
        }),
        {},
      )

    return visitors
  },
})
