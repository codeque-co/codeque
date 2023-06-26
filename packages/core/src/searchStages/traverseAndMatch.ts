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
  visitors: Record<string, (node: PoorNodeType) => void>,
  onNode?: (node: PoorNodeType, parentMeta?: ParentMeta) => void,
  parentMeta?: {
    node: PoorNodeType
    key: string
    index?: number
  },
) => {
  const visitor = visitors[fileNode.type as string]

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
          traverseAst(nestedNode, isNode, visitors, onNode, parentMeta)
        }
      }
    }
  }
}

export const traverseAstIterative = (
  fileNode: PoorNodeType,
  isNode: ParserSettings['isNode'],
  visitors: Record<string, (node: PoorNodeType) => void>,
  onNode?: (node: PoorNodeType) => void,
) => {
  const stack = [fileNode]

  while (stack.length > 0) {
    const node = stack.pop() as PoorNodeType

    const visitor = visitors[node.type as string]

    visitor?.(node)
    onNode?.(node)

    const keysWithNodes: string[] = getKeysWithNodes(
      node,
      Object.keys(node),
      isNode,
    )

    for (let i = 0; i < keysWithNodes.length; i++) {
      const key = keysWithNodes[i]

      if (node[key] !== undefined) {
        if (isNode(node[key] as PoorNodeType)) {
          stack.push(node[key] as PoorNodeType)
        } else {
          const nestedNodesArray = node[key] as PoorNodeType[]

          for (let j = 0; j < nestedNodesArray.length; j++) {
            const nestedNode = nestedNodesArray[j]
            stack.push(nestedNode)
          }
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

    const match = validateMatch(node, queryNode, settings, matchContext)

    if (match) {
      const matchData = getMatchFromNode(
        node,
        settings.parserSettings,
        matchContext.getAllAliases(),
      )
      matches.push(matchData)
    }
  }

  const visitorKeysForAliasedTreeWildcards =
    initialMatchContext?.nodesTreeAliasesMap
      ? Object.values(initialMatchContext?.nodesTreeAliasesMap).map(
          (alias) => alias.aliasNode.type as string,
        )
      : []

  const visitorsMap = uniqueItems(
    getVisitorKeysForQueryNodeType(
      queryNode.type as string,
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

  traverseAst(fileNode, settings.parserSettings.isNode, visitorsMap)

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

  const matchContext = createMatchContext(initialMatchContext)

  /**
   * LOOK FOR MATCH START
   */
  const { levelMatch, fileKeysToTraverseForOtherMatches } = compareNodes({
    fileNode,
    queryNode,
    searchSettings: settingsWithLogger,
    matchContext,
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
    const match = validateMatch(fileNode, queryNode, settings, matchContext)
    measureValidate()

    if (match) {
      matches.push(
        getMatchFromNode(
          fileNode,
          parserSettings,
          matchContext.getAllAliases(),
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
