import { sortByLeastIdentifierStrength } from '../astUtils'
import {
  GetCodeForNode,
  Mode,
  PoorNodeType,
  SearchSettings,
  SearchSettingsWithOptionalLogger,
} from '../types'
import { getKeyFromObject, noopLogger } from '../utils'
import { compareNodes } from './compareNodes'
import { Logger } from '../logger'
import { MatchContext } from '../matchContext'

export const validateMatch = (
  fileNode: PoorNodeType,
  queryNode: PoorNodeType,
  settings: SearchSettingsWithOptionalLogger & GetCodeForNode,
  matchContext: MatchContext,
) => {
  const settingsWithLogger: SearchSettings & GetCodeForNode = {
    ...settings,
    logger: settings.logger ?? noopLogger,
  }
  const {
    mode,
    parserSettings,
    getCodeForNode = () => 'getCodeForNode not provided',
    logger: { log, logStepStart },
  } = settingsWithLogger

  const isExact = mode === 'exact'

  logStepStart('validate')

  log('validate: queryNode', queryNode)
  log('validate: fileNode', fileNode)

  const {
    levelMatch,
    queryKeysToTraverseForValidatingMatch,
    fileKeysToTraverseForValidatingMatch,
  } = compareNodes({
    fileNode: fileNode,
    queryNode: queryNode,
    searchSettings: settingsWithLogger,
    matchContext,
  })

  if (
    fileKeysToTraverseForValidatingMatch.length !==
    queryKeysToTraverseForValidatingMatch.length
  ) {
    throw new Error(
      `Count of keys to validate in query and file does not match for nodes ${fileNode.type}:${fileNode?.name} ${queryNode.type}:${queryNode?.name}, [${fileKeysToTraverseForValidatingMatch}] [${queryKeysToTraverseForValidatingMatch}]`,
    )
  }

  if (
    fileKeysToTraverseForValidatingMatch.some((fileKey) => {
      return fileKey.includes('.')
    })
  ) {
    log('validating match with nested file key')
  }

  if (
    queryKeysToTraverseForValidatingMatch.some((queryKey) => {
      return queryKey.includes('.')
    })
  ) {
    log('validating match with nested query key')
  }

  if (!levelMatch) {
    try {
      log(
        'nodes incompatible :\n\n',
        getCodeForNode(fileNode, 'file'),
        '\n\n',
        getCodeForNode(queryNode, 'query'),
        '\n'.padEnd(10, '_'),
      )
    } catch (e) {
      log('nodes incompat:\n\n', 'invalid code')
    }

    return false
  } else {
    if (queryKeysToTraverseForValidatingMatch.length > 0) {
      for (let i = 0; i < queryKeysToTraverseForValidatingMatch.length; i++) {
        const queryKeyToTraverse = queryKeysToTraverseForValidatingMatch[i]
        const fileKeyToTraverse = fileKeysToTraverseForValidatingMatch[i]

        const queryValue = getKeyFromObject(queryNode, queryKeyToTraverse)
        const fileValue = getKeyFromObject(fileNode, fileKeyToTraverse)

        log('validate: queryKeyToTraverse', queryKeyToTraverse)
        log('validate: fileKeyToTraverse', fileKeyToTraverse)

        log('validate: query val', queryValue)
        log('validate: file val', fileValue)

        if (
          Array.isArray(fileValue as PoorNodeType[]) &&
          Array.isArray(queryValue as PoorNodeType[])
        ) {
          log('validate: is array')
          const fileNodesArr = (fileValue as PoorNodeType[]).filter(
            parserSettings.shouldCompareNode,
          )
          const queryNodesArr = (queryValue as PoorNodeType[]).filter(
            parserSettings.shouldCompareNode,
          )

          if (isExact) {
            if (fileNodesArr.length !== queryNodesArr.length) {
              return false
            }

            for (let i = 0; i < fileNodesArr.length; i++) {
              const newCurrentNode = fileNodesArr[i]
              const newCurrentQueryNode = queryNodesArr[i]

              if (
                !newCurrentNode ||
                !newCurrentQueryNode ||
                !validateMatch(
                  newCurrentNode,
                  newCurrentQueryNode,
                  settings,
                  matchContext,
                )
              ) {
                return false
              }
            }
          } else {
            if (queryNodesArr.length > fileNodesArr.length) {
              log('validate: more query nodes than array nodes')

              return false
            }

            const matchedIndexes: number[] = []

            const queryNodesArrSorted = [...queryNodesArr].sort((a, b) =>
              sortByLeastIdentifierStrength(
                a,
                b,
                parserSettings.wildcardUtils,
                parserSettings.getIdentifierNodeName,
              ),
            )

            for (let i = 0; i < queryNodesArrSorted.length; i++) {
              const newQueryNode = queryNodesArrSorted[i]

              for (let j = 0; j < fileNodesArr.length; j++) {
                const newFileNode = fileNodesArr[j]

                if (!matchedIndexes.includes(j)) {
                  if (
                    validateMatch(
                      newFileNode,
                      newQueryNode,
                      settings,
                      matchContext,
                    )
                  ) {
                    matchedIndexes.push(j)
                    break
                  }
                }
              }

              if (matchedIndexes.length !== i + 1) {
                return false
              }
            }

            if (mode === ('include-with-order' as Mode)) {
              const propsFoundInOrder = matchedIndexes.every(
                (val, idx, arr) => {
                  if (idx + 1 === arr.length) {
                    return true
                  } else {
                    return val < arr[idx + 1]
                  }
                },
              )

              if (
                !propsFoundInOrder ||
                matchedIndexes.length !== queryNodesArr.length
              ) {
                return false
              }
            } else {
              if (matchedIndexes.length !== queryNodesArr.length) {
                return false
              }
            }

            log('validate: non boolean return result for comparing nodes array')
          }
        } else {
          log('validate: is Node')

          const newFileNode = fileValue as PoorNodeType
          const newQueryNode = queryValue as PoorNodeType
          log('validate: newFileNode', newFileNode)
          log('validate: newQueryNode', newQueryNode)

          if (
            !newFileNode ||
            !newQueryNode ||
            !validateMatch(newFileNode, newQueryNode, settings, matchContext)
          ) {
            return false
          }
        }
      }

      return true
    } else {
      return true
    }
  }
}
