import { Match, PoorNodeType, SearchSettings } from '../types'
import { measureStart } from '../utils'
import { compareNodes } from './compareNodes'
import { validateMatch } from './validateMatch'
import {
  getMatchFromNode,
  getVisitorKeysForQueryNodeType,
  getKeysWithNodes,
} from '../astUtils'

/**
 *
 *
 * We can try ESlint traversal next time (eslint uses https://www.npmjs.com/package/estraverse)
 *
 * Other interesting case is that @typescript-eslint/parser expose `visitorKeys` via parseEslint.
 * VisitorKeys is a set of keys containing other nodes for each node type
 */

const test_traverse_ast = (
  fileNode: PoorNodeType,
  settings: SearchSettings,
  visitors: Record<string, (node: PoorNodeType) => void>,
) => {
  const visitor = visitors[fileNode.type as string]

  visitor?.(fileNode)

  const keysWithNodes: string[] = getKeysWithNodes(
    fileNode,
    Object.keys(fileNode),
    settings.parserSettings.isNode,
  )

  keysWithNodes.forEach((key) => {
    if (fileNode[key] !== undefined) {
      if (settings.parserSettings.isNode(fileNode[key] as PoorNodeType)) {
        test_traverse_ast(fileNode[key] as PoorNodeType, settings, visitors)
      } else {
        const nestedNodesArray = fileNode[key] as PoorNodeType[]

        nestedNodesArray.forEach((node) =>
          test_traverse_ast(node, settings, visitors),
        )
      }
    }
  })
}

export const test_traverseAndMatchWithVisitors = (
  fileNode: PoorNodeType,
  queryNode: PoorNodeType,
  settings: SearchSettings,
) => {
  const matches: Match[] = []

  const searchInPath = (node: PoorNodeType) => {
    const match = validateMatch(node, queryNode, settings)

    if (match) {
      const matchData = getMatchFromNode(node, settings.parserSettings)
      matches.push(matchData)
    }
  }

  const visitorsMap = getVisitorKeysForQueryNodeType(
    queryNode.type as string,
    settings.parserSettings,
  ).reduce(
    (map, visitorKey) => ({
      ...map,
      [visitorKey]: searchInPath,
    }),
    {},
  )

  test_traverse_ast(fileNode, settings, visitorsMap)

  return matches
}

export const traverseAndMatch = (
  fileNode: PoorNodeType,
  queryNode: PoorNodeType,
  settings: SearchSettings & {
    getCodeForNode?: (node: PoorNodeType, nodeType: 'query' | 'file') => string
  },
) => {
  const {
    logger: { log, logStepEnd, logStepStart },
    parserSettings,
    getCodeForNode = () => '',
  } = settings

  logStepStart('traverse')
  const matches = []

  /**
   * LOOK FOR MATCH START
   */
  const { levelMatch, fileKeysToTraverseForOtherMatches } = compareNodes({
    fileNode,
    queryNode,
    searchSettings: settings,
  })

  const foundMatchStart = levelMatch

  /**
   * PROCESS CURRENT MATCH
   */

  if (foundMatchStart) {
    // We keep logs in IIFE to get the whole logic removed during build
    log(
      'foundMatchStart:\n',
      getCodeForNode(fileNode, 'file'),
      '\n',
      getCodeForNode(queryNode, 'query'),
      '\n'.padEnd(10, '_'),
    )

    const measureValidate = measureStart('validate')
    const match = validateMatch(fileNode, queryNode, settings)
    measureValidate()

    if (match) {
      matches.push(getMatchFromNode(fileNode, parserSettings))
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
          )
        } else {
          return (fileNode[key] as PoorNodeType[]).map((node) =>
            traverseAndMatch(node, queryNode, settings),
          )
        }
      }

      return []
    })
    .flat(2) as Match[]

  logStepEnd('traverse')

  return [...matches, ...nestedMatches].flat()
}
