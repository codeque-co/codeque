import { sortByLeastIdentifierStrength } from '../astUtils'
import { Mode, PoorNodeType, SearchSettings } from '../types'
import { getKeyFromObject } from '../utils'
import { compareNodes } from './compareNodes'

export const validateMatch = (
  currentNode: PoorNodeType,
  currentQueryNode: PoorNodeType,
  settings: SearchSettings,
) => {
  const {
    mode,
    logger: { log, logStepStart },
    parserSettings,
  } = settings

  const isExact = mode === 'exact'

  logStepStart('validate')

  const {
    levelMatch,
    queryKeysToTraverseForValidatingMatch,
    fileKeysToTraverseForValidatingMatch,
  } = compareNodes({
    fileNode: currentNode,
    queryNode: currentQueryNode,
    searchSettings: settings,
  })

  if (
    fileKeysToTraverseForValidatingMatch.length !==
    queryKeysToTraverseForValidatingMatch.length
  ) {
    throw new Error(
      `Count of keys to validate in query and file does not match for nodes ${currentNode.type}:${currentNode?.name} ${currentQueryNode.type}:${currentQueryNode?.name}, [${fileKeysToTraverseForValidatingMatch}] [${queryKeysToTraverseForValidatingMatch}]`,
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
        'nodes incompat:\n\n',
        parserSettings.generateCode(currentNode),
        '\n\n',
        parserSettings.generateCode(currentQueryNode),
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

        const queryValue = getKeyFromObject(
          currentQueryNode,
          queryKeyToTraverse,
        )
        const fileValue = getKeyFromObject(currentNode, fileKeyToTraverse)

        log('validate: queryKeyToTraverse', queryKeyToTraverse)
        log('validate: fileKeyToTraverse', fileKeyToTraverse)

        log('validate: query val', queryValue)
        log('validate: file val', fileValue)

        if (Array.isArray(fileValue as PoorNodeType[])) {
          log('validate: is array')
          const nodesArr = (fileValue as PoorNodeType[]).filter(
            parserSettings.shouldCompareNode,
          )
          const queryNodesArr = (queryValue as PoorNodeType[]).filter(
            parserSettings.shouldCompareNode,
          )

          if (isExact) {
            if (nodesArr.length !== queryNodesArr.length) {
              return false
            }

            for (let i = 0; i < nodesArr.length; i++) {
              const newCurrentNode = nodesArr[i]
              const newCurrentQueryNode = queryNodesArr[i]

              if (
                !newCurrentNode ||
                !newCurrentQueryNode ||
                !validateMatch(newCurrentNode, newCurrentQueryNode, settings)
              ) {
                return false
              }
            }
          } else {
            if (queryNodesArr.length > nodesArr.length) {
              return false
            }

            const matchedIndexes: number[] = []

            const queryNodesArrSorted = [...queryNodesArr].sort((a, b) =>
              sortByLeastIdentifierStrength(a, b, parserSettings.wildcardUtils),
            )

            for (let i = 0; i < queryNodesArrSorted.length; i++) {
              const queryNode = queryNodesArrSorted[i]

              for (let j = 0; j < nodesArr.length; j++) {
                const newCurrentNode = nodesArr[j]

                if (!matchedIndexes.includes(j)) {
                  if (validateMatch(newCurrentNode, queryNode, settings)) {
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
          }
        } else {
          log('validate: is Node')

          const newCurrentNode = fileValue as PoorNodeType
          const newCurrentQueryNode = queryValue as PoorNodeType
          log('validate: newCurrentNode', newCurrentNode)
          log('validate: newCurrentQueryNode', newCurrentQueryNode)

          if (
            !newCurrentNode ||
            !newCurrentQueryNode ||
            !validateMatch(newCurrentNode, newCurrentQueryNode, settings)
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
