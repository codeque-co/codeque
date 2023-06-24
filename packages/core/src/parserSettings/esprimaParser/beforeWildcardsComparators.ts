import { NodesComparator } from '../../types'
import { wildcardForAssignmentPatternOrDefaultParamValuesNodesComparator } from './nodeComparators/wildcardForAssignmentPatternOrDefaultParamValues'

export const beforeWildcardsComparators: NodesComparator[] = [
  wildcardForAssignmentPatternOrDefaultParamValuesNodesComparator,
]
