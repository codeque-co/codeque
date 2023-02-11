import { Match, PoorNodeType, SearchSettings } from '../types'
import { measureStart } from '../utils'
import { compareNodes } from './compareNodes'
import { validateMatch } from './validateMatch'
import { getMatchFromNode } from '../astUtils'

/**
 *
 * To make it work we have
 * - Modify parser settings to be able to add alternative visitors for given node types (JSXIdentifier vs Identifier)
 * - Figure out problem with multiline queries
 * - This has a chance to improve performance in cases where we have multiple queries
 *
 * This is slower than our custom impl.
 * We can try ESlint traversal next time (eslint uses https://www.npmjs.com/package/estraverse)
 *
 * Other interesting case is that @typescript-eslint/parser expose `visitorKeys` via parseEslint.
 * VisitorKeys is a set of keys containing other nodes for each node type
 */
const traverseAndMatchBabel = (
  fileNode: PoorNodeType,
  queryNode: PoorNodeType,
  settings: SearchSettings & {
    getCodeForNode?: (node: PoorNodeType, nodeType: 'query' | 'file') => string
  },
) => {
  const matches: Match[] = []

  const fileNodeForBabel = {
    type: 'File',
    program: fileNode,
  }
  const traverse: any = '@babel/traverse'

  traverse(fileNodeForBabel as any, {
    [queryNode.type as string]: (path: any) => {
      const node = path.node
      const match = validateMatch(node, queryNode, settings)

      if (match) {
        const matchData = getMatchFromNode(node, settings.parserSettings)
        matches.push(matchData)
      }
    },
  })

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
