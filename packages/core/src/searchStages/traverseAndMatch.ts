import { Match, PoorNodeType, SearchSettings } from '../types'
import { measureStart } from '../utils'
import { compareNodes } from './compareNodes'
import { validateMatch } from './validateMatch'

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
      const matchData = {
        ...parserSettings.getNodePosition(fileNode),
        node: fileNode,
      } as Match

      matches.push(matchData)
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
