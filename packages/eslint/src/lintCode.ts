import { Rule } from 'eslint'
import {
  parseQueries,
  __internal,
  NotNullParsedQuery,
  PoorNodeType,
  filterIncludeExclude,
  ParsedQuery,
} from '@codeque/core'

import {
  ParsedQueryWithSettings,
  VisitorsSearchArrayMap,
  VisitorsSearchMap,
  RuleOption,
} from './types'

import {
  formatQueryParseErrors,
  createMultipleSearchFunctionsExecutor,
  assertCompatibleParser,
  parserNamesMappingsToCodeQueInternal,
} from './utils'

const queriesCache = {} as Record<string, ParsedQuery>

let preparationTime = 0
let shallowSearchTime = 0
let preparingVisitorsTime = 0
let preparingQueriesTime = 0
let filteringFilePathsTime = 0
const searchTimeForQueries = {} as Record<string, number>

process.on('beforeExit', () => {
  const shouldPrintMetric = process.env.CODEQUE_DEBUG === 'true'

  if (shouldPrintMetric) {
    console.log('\nCodeQue debug metrics:\n')
    console.log('preparationTime', preparationTime)
    console.log('shallowSearchTime', shallowSearchTime)
    console.log('preparingVisitorsTime', preparingVisitorsTime)
    console.log('preparingQueriesTime', preparingQueriesTime)
    console.log('filteringFilePathsTime', filteringFilePathsTime)
    console.log('searchTimeForQueries', searchTimeForQueries)
    console.log('')
  }
})

export const createLintCode = (type: Rule.RuleMetaData['type']) => ({
  meta: {
    type: type,
    docs: {
      description: 'Lint anything based on code sample(s).',
    },
    fixable: 'code' as const,
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
    const prepStart = performance.now()
    const parser = assertCompatibleParser(context.parserPath)

    const settings = context.options[0] as Array<RuleOption> | undefined

    if (!settings || settings.length === 0) {
      return {}
    }

    const code = context.getSourceCode().text
    const absoluteFilePath = context.getPhysicalFilename()
    const root = context.getCwd()

    const defaultCaseInsensitive = true
    const queryCodes = settings.map(({ query }) => query)
    const searchModes = settings.map(({ mode }) => mode).filter(Boolean)

    if (queryCodes.includes(undefined) || queryCodes.includes(null as any)) {
      throw new Error('Each setting has to have at least query defined.')
    }

    if (searchModes.includes('text')) {
      throw new Error('"Text" search mode is not supported.')
    }

    const parserSettings =
      __internal.parserSettingsMap[
        parserNamesMappingsToCodeQueInternal[parser]
      ]()

    const startPreparingQueries = performance.now()

    const queriesParseResult = settings.map(
      ({ query, caseInsensitive: caseInsensitive_ }) => {
        const caseInsensitive = caseInsensitive_ ?? defaultCaseInsensitive
        const cacheKey = `(${query});${caseInsensitive}`
        const queryFromCache = queriesCache[cacheKey]

        if (queryFromCache) {
          return [[queryFromCache], true] as [ParsedQuery[], boolean]
        }

        const parsedQuery = parseQueries(
          [query] as string[],
          caseInsensitive,
          parserSettings,
        )

        queriesCache[cacheKey] = parsedQuery[0][0]

        return parsedQuery
      },
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
      includeFiles: settings[idx].includeFiles, // need to be undefined, cannot be empty array
      excludeFiles: settings[idx].excludeFiles ?? [],
    })) as ParsedQueryWithSettings[]

    preparingQueriesTime += performance.now() - startPreparingQueries

    const startFilteringFilePaths = performance.now()
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

    filteringFilePathsTime += performance.now() - startFilteringFilePaths

    const shallowStart = performance.now()
    const queriesWithSettingsMatchedShallow =
      queriesWithSettingsMatchedFilePath.filter((parsedQuery) => {
        return __internal.shallowSearch({
          queries: [parsedQuery.parsedQuery] as NotNullParsedQuery[],
          fileContent: code,
          logger: {} as any,
          caseInsensitive: parsedQuery.caseInsensitive,
        })
      }) as ParsedQueryWithSettings[]

    shallowSearchTime += performance.now() - shallowStart

    if (queriesWithSettingsMatchedShallow.length === 0) {
      return {}
    }

    const preparingVisitorsStart = performance.now()
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
            parserSettings,
            debug: false,
            caseInsensitive: queryWithSettings.caseInsensitive,
          }
          const startSearch = performance.now()
          const { isMultistatement, queryCode, queryNode } =
            queryWithSettings.parsedQuery

          if (searchTimeForQueries[queryCode] === undefined) {
            searchTimeForQueries[queryCode] = 0
          }

          const matchContext = __internal.createMatchContext()
          const match = __internal.validateMatch(
            node,
            queryWithSettings.parsedQuery.queryNode,
            searchOptions,
            matchContext,
          )

          if (match) {
            let matchData = __internal.getMatchFromNode(
              node,
              parserSettings,
              matchContext.getAllAliases(),
            )

            if (isMultistatement) {
              /**
               * For multi-statement queries we search where exactly statements are located within parent node
               */
              matchData = __internal.getLocationOfMultilineMatch(
                matchData,
                queryNode,
                searchOptions,
                __internal.traverseAndMatch,
              )
            }

            searchTimeForQueries[queryCode] += performance.now() - startSearch

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
    preparingVisitorsTime += performance.now() - preparingVisitorsStart
    preparationTime += performance.now() - prepStart

    return visitors as unknown as Record<string, (node: Rule.Node) => void>
  },
})
