import { Rule } from 'eslint'
import {
  Mode,
  parseQueries,
  __internal,
  NotNullParsedQuery,
  PoorNodeType,
  filterIncludeExclude,
  ParsedQuery,
} from '@codeque/core'
import {
  formatQueryParseErrors,
  createMultipleSearchFunctionsExecutor,
  supportedParsers,
} from './utils'
import {
  ParsedQueryWithSettings,
  VisitorsSearchArrayMap,
  VisitorsSearchMap,
} from './types'
import { assertCompatibleParser } from './utils'

/**
 * TODO: To verify if new approach traversal work correct, we can change implementation of traversal in main search and run tests
 */

const cache = {} as any
let preparationTime = 0

process.on('beforeExit', () => {
  console.log('CACHE', cache)
  console.log('preparationTime', preparationTime)
})

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
            includeFiles: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            excludeFiles: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
    ],
  },
  create: function (context: Rule.RuleContext) {
    const prepStart = Date.now()
    assertCompatibleParser(context.parserPath)

    const settings = context.options[0] as
      | Array<{
          mode?: Mode
          query?: string
          message?: string
          caseInsensitive?: boolean
          includeFiles?: string[]
          excludeFiles?: string[]
        }>
      | undefined

    if (!settings || settings.length === 0) {
      return {}
    }

    const code = context.getSourceCode().text
    const absoluteFilePath = context.getPhysicalFilename()
    const root = context.getCwd()

    const defaultCaseInsensitive = true
    const queryCodes = settings.map(({ query }) => query)

    if (queryCodes.includes(undefined) || queryCodes.includes(null as any)) {
      throw new Error('Each setting has to have at least query defined.')
    }

    const parserSettings = __internal.parserSettingsMap['typescript-eslint']()
    let queriesParseResult: [ParsedQuery[], boolean][] = cache.queries

    if (!queriesParseResult) {
      queriesParseResult = settings.map(({ query, caseInsensitive }) =>
        parseQueries(
          [query] as string[],
          caseInsensitive ?? defaultCaseInsensitive,
          parserSettings,
        ),
      )

      cache.queries = queriesParseResult
    }

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
      includeFiles: settings[idx].includeFiles, // need to be undefined, cannot be empty array
      excludeFiles: settings[idx].excludeFiles ?? [],
    })) as ParsedQueryWithSettings[]

    const queriesWithSettingsMatchedFilePath = parsedQueriesWithSettings.filter(
      ({ includeFiles, excludeFiles }) => {
        const matchedFilePath = filterIncludeExclude({
          filesList: [absoluteFilePath],
          searchRoot: root,
          exclude: excludeFiles,
          include: includeFiles,
        })

        return matchedFilePath.length === 1
      },
    )

    const queriesWithSettingsMatchedShallow =
      queriesWithSettingsMatchedFilePath.filter((parsedQuery) => {
        return __internal.shallowSearch({
          queries: [parsedQuery.parsedQuery] as NotNullParsedQuery[],
          fileContent: code,
          logger: {} as any,
          caseInsensitive: parsedQuery.caseInsensitive,
        })
      }) as ParsedQueryWithSettings[]

    if (queriesWithSettingsMatchedShallow.length === 0) {
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

    const visitorsSearchArrayMap = Object.entries(
      queryCodesGroupedByStartingNode,
    )
      .map(([nodeType, queries]) => {
        const visitorKeys = __internal.getVisitorKeysForQueryNodeType(
          nodeType,
          parserSettings,
        )

        const searchForNode = createSearchForNode(queries)

        const objectEntries = visitorKeys.map((visitorKey) => [
          visitorKey,
          searchForNode,
        ])

        return Object.fromEntries(objectEntries) as VisitorsSearchMap
      })
      .reduce((visitorsMap, visitorObj) => {
        const newVisitorsMap: VisitorsSearchArrayMap = { ...visitorsMap }

        for (const visitorKey in visitorObj) {
          const searchFn = visitorObj[visitorKey]

          if (Array.isArray(newVisitorsMap[visitorKey])) {
            newVisitorsMap[visitorKey].push(searchFn)
          } else {
            newVisitorsMap[visitorKey] = [searchFn]
          }
        }

        return newVisitorsMap
      }, {} as VisitorsSearchArrayMap)

    const visitors = Object.fromEntries(
      Object.entries(visitorsSearchArrayMap).map(
        ([visitorKey, searchFnsArray]) => {
          return [
            visitorKey,
            createMultipleSearchFunctionsExecutor(searchFnsArray),
          ]
        },
      ),
    )
    preparationTime += Date.now() - prepStart

    return visitors
  },
})
