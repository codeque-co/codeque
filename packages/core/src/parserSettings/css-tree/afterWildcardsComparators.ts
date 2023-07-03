import { NodesComparator } from '../../types'
import { matchRuleWithoutSelector } from './matchRuleWithoutSelector'

export const afterWildcardsComparators: NodesComparator[] = [
  matchRuleWithoutSelector,
]
