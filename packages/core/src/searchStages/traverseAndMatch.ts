import {
  GetCodeForNode,
  Match,
  PoorNodeType,
  SearchSettings,
  SearchSettingsWithOptionalLogger,
  ParserSettings,
} from '../types'
import { measureStart, noopLogger, uniqueItems } from '../utils'
import { compareNodes } from './compareNodes'
import { validateMatch } from './validateMatch'
import {
  getMatchFromNode,
  getVisitorKeysForQueryNodeType,
  getKeysWithNodes,
} from '../astUtils'
import {
  MatchContext,
  createMatchContext,
  MatchContextAliases,
} from '../matchContext'

/**
 *
 *
 * We can try ESlint traversal next time (eslint uses https://www.npmjs.com/package/estraverse)
 *
 * Other interesting case is that @typescript-eslint/parser expose `visitorKeys` via parseEslint.
 * VisitorKeys is a set of keys containing other nodes for each node type
 */

type ParentMeta = {
  node: PoorNodeType
  key: string
  index?: number
}

export const traverseAst = (
  fileNode: PoorNodeType,
  isNode: ParserSettings['isNode'],
  getNodeType: ParserSettings['getNodeType'],
  visitors: Record<string, (node: PoorNodeType) => void>,
  onNode?: (node: PoorNodeType, parentMeta?: ParentMeta) => void,
  parentMeta?: {
    node: PoorNodeType
    key: string
    index?: number
  },
) => {
  const visitor = visitors[getNodeType(fileNode)]

  visitor?.(fileNode)
  onNode?.(fileNode, parentMeta)

  const keysWithNodes: string[] = getKeysWithNodes(
    fileNode,
    Object.keys(fileNode),
    isNode,
  )

  for (let i = 0; i < keysWithNodes.length; i++) {
    const key = keysWithNodes[i]

    if (fileNode[key] !== undefined) {
      if (isNode(fileNode[key] as PoorNodeType)) {
        const parentMeta = {
          node: fileNode,
          key,
        }

        traverseAst(
          fileNode[key] as PoorNodeType,
          isNode,
          getNodeType,
          visitors,
          onNode,
          parentMeta,
        )
      } else {
        const nestedNodesArray = fileNode[key] as PoorNodeType[]

        for (let j = 0; j < nestedNodesArray.length; j++) {
          const parentMeta = {
            node: fileNode,
            key,
            index: j,
          }
          const nestedNode = nestedNodesArray[j]

          traverseAst(
            nestedNode,
            isNode,
            getNodeType,
            visitors,
            onNode,
            parentMeta,
          )
        }
      }
    }
  }
}

export const test_traverseAndMatchWithVisitors = (
  fileNode: PoorNodeType,
  queryNode: PoorNodeType,
  settings: SearchSettingsWithOptionalLogger,
  initialMatchContext?: MatchContextAliases,
) => {
  const matches: Match[] = []

  const searchInPath = (node: PoorNodeType) => {
    const matchContext = createMatchContext(initialMatchContext)

    const { match, matchContext: extendedMatchContext } = validateMatch(
      node,
      queryNode,
      settings,
      matchContext,
    )

    if (match) {
      const matchData = getMatchFromNode(
        node,
        settings.parserSettings,
        extendedMatchContext.getAllAliases(),
      )
      matches.push(matchData)
    }
  }

  const visitorKeysForAliasedTreeWildcards =
    initialMatchContext?.nodesTreeAliasesMap
      ? Object.values(initialMatchContext?.nodesTreeAliasesMap).map((alias) =>
          settings.parserSettings.getNodeType(alias.aliasNode),
        )
      : []

  const visitorsMap = uniqueItems(
    getVisitorKeysForQueryNodeType(
      settings.parserSettings.getNodeType(queryNode),
      settings.parserSettings,
    ),
    ...visitorKeysForAliasedTreeWildcards.map((nodeType) =>
      getVisitorKeysForQueryNodeType(nodeType, settings.parserSettings),
    ),
  ).reduce(
    (map, visitorKey) => ({
      ...map,
      [visitorKey]: searchInPath,
    }),
    {},
  )

  traverseAst(
    fileNode,
    settings.parserSettings.isNode,
    settings.parserSettings.getNodeType,
    visitorsMap,
  )

  return matches
}

export const traverseAndMatch = (
  fileNode: PoorNodeType,
  queryNode: PoorNodeType,
  settings: SearchSettingsWithOptionalLogger & GetCodeForNode,
  initialMatchContext?: MatchContextAliases,
) => {
  const settingsWithLogger: SearchSettings & GetCodeForNode = {
    ...settings,
    logger: settings.logger ?? noopLogger,
  }
  const {
    logger: { log, logStepEnd, logStepStart },
    parserSettings,
    getCodeForNode = () => 'getCodeForNode not provided',
  } = settingsWithLogger

  logStepStart('traverse')
  const matches = []

  const localMatchContext = createMatchContext(initialMatchContext)

  /**
   * LOOK FOR MATCH START
   */
  const { levelMatch, fileKeysToTraverseForOtherMatches } = compareNodes({
    fileNode,
    queryNode,
    searchSettings: settingsWithLogger,
    // To not bind ref in case rest of match is incorrect
    matchContext: createMatchContext(initialMatchContext),
  })

  const foundMatchStart = levelMatch

  /**
   * PROCESS CURRENT MATCH
   */

  if (foundMatchStart) {
    // We keep logs in IIFE to get the whole logic removed during build
    log(
      'foundMatchStart:\n',
      getCodeForNode(queryNode, 'query'),
      '\n',
      getCodeForNode(fileNode, 'file'),
      '\n'.padEnd(10, '_'),
    )

    const measureValidate = measureStart('validate')
    const { match, matchContext: extendedMatchContext } = validateMatch(
      fileNode,
      queryNode,
      settings,
      localMatchContext,
    )
    measureValidate()

    if (match) {
      matches.push(
        getMatchFromNode(
          fileNode,
          parserSettings,
          extendedMatchContext.getAllAliases(),
        ),
      )
    } else {
      log('match not validated')
    }
  }

  /**
   * TRAVERSE TO FIND NEW MATCHES START
   */

  const nestedMatches = fileKeysToTraverseForOtherMatches
    .map((key) => {
      if (fileNode[key] !== undefined) {
        if (parserSettings.isNode(fileNode[key] as PoorNodeType)) {
          return traverseAndMatch(
            fileNode[key] as PoorNodeType,
            queryNode,
            settings,
            initialMatchContext,
          )
        } else {
          return (fileNode[key] as PoorNodeType[]).map((node) =>
            traverseAndMatch(node, queryNode, settings, initialMatchContext),
          )
        }
      }

      return []
    })
    .flat(2) as Match[]

  logStepEnd('traverse')

  return [...matches, ...nestedMatches].flat()
}
