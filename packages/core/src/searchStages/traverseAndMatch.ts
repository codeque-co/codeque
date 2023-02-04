import generate from '@babel/generator'
import { babelParserSettings } from '../parserSettings'
import { Match, PoorNodeType, SearchSettings } from '../types'
import { measureStart } from '../utils'
import { compareNodes } from './compareNodes'
import { validateMatch } from './validateMatch'

export const traverseAndMatch = (
  currentNode: PoorNodeType,
  queryNode: PoorNodeType,
  settings: SearchSettings,
) => {
  const {
    logger: { log, logStepEnd, logStepStart },
  } = settings

  logStepStart('traverse')
  const matches = []

  /**
   * LOOK FOR MATCH START
   */
  const { levelMatch, fileKeysToTraverseForOtherMatches } = compareNodes({
    fileNode: currentNode,
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
      (() => {
        try {
          return babelParserSettings.generateCode(currentNode as any, {
            jsescOption: { compact: false },
            retainFunctionParens: true,
          })
        } catch (e) {
          // It's not possible to generate code for some nodes like TSTypeParameterInstantiation
          return `Could not generate code for node ${currentNode.type}`
        }
      })(),
      '\n',
      babelParserSettings.generateCode(queryNode as any),
      '\n'.padEnd(10, '_'),
    )

    const measureValidate = measureStart('validate')
    const match = validateMatch(currentNode, queryNode, settings)
    measureValidate()

    if (match) {
      matches.push({
        start: currentNode.start as number,
        end: currentNode.end as number,
        loc: currentNode.loc as Match['loc'],
        node: currentNode,
      } as Match)
    }
  }

  /**
   * TRAVERSE TO FIND NEW MATCHES START
   */

  const nestedMatches = fileKeysToTraverseForOtherMatches
    .map((key) => {
      if (currentNode[key] !== undefined) {
        if (babelParserSettings.isNode(currentNode[key] as PoorNodeType)) {
          return traverseAndMatch(
            currentNode[key] as PoorNodeType,
            queryNode,
            settings,
          )
        } else {
          return (currentNode[key] as PoorNodeType[]).map((node) =>
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
