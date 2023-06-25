import { NodesComparator } from '../../types'
import { createMatchWildcardsInPropValueNodesComparator } from '../nodeComparatorFactories/Other/matchWildcardsInPropValueNodes'

const matchWildcardsInPropValueNodesComparator =
  createMatchWildcardsInPropValueNodesComparator({
    nodeType: 'TextAttribute',
    keysToTraverse: [],
    // Order of keys definition does matter for matchContext! In case someone would use the same alias in eg. prop and value
    keysWithWildcards: ['name', 'value'],
  })

export const beforeWildcardsComparators: NodesComparator[] = [
  matchWildcardsInPropValueNodesComparator,
]
