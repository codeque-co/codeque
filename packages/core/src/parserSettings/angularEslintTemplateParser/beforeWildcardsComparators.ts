import { NodesComparator } from '../../types'
import { createMatchWildcardsInPropValueNodesComparator } from '../nodeComparatorFactories/Other/matchWildcardsInPropValueNodes'
import { matchMultilineQueriesNodesComparator } from './matchMultilineQueriesNodesComparator'

const matchWildcardsInTextAttributeNodesComparator =
  createMatchWildcardsInPropValueNodesComparator({
    nodeType: 'TextAttribute',
    keysToTraverse: [],
    // Order of keys definition does matter for matchContext! In case someone would use the same alias in eg. prop and value
    keysWithWildcards: ['name', 'value'],
  })

const matchWildcardsInElement$1NodesComparator =
  createMatchWildcardsInPropValueNodesComparator({
    nodeType: 'Element$1',
    keysToTraverse: ['attributes', 'children'],
    keysWithWildcards: ['name'],
  })

export const beforeWildcardsComparators: NodesComparator[] = [
  matchWildcardsInTextAttributeNodesComparator,
  matchWildcardsInElement$1NodesComparator,
  matchMultilineQueriesNodesComparator,
]
