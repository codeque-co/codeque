import { NodesComparator } from '../../types'
import { compareWildcardForTypeKeywords } from './nodeComparators/wildcardForTypeKeywords'
import { wildcardForAssignmentPatternOrDefaultParamValuesNodesComparator } from './nodeComparators/wildcardForAssignmentPatternOrDefaultParamValues'

export const beforeWildcardsComparators: NodesComparator[] = [
  compareWildcardForTypeKeywords,
  wildcardForAssignmentPatternOrDefaultParamValuesNodesComparator,
]
