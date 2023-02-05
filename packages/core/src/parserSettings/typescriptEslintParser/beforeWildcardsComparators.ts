import { NodesComparator } from '../../types'
import { wildcardForTypeKeywordsNodesComparator } from './nodeComparators/wildcardForTypeKeywords'
import { wildcardForAssignmentPatternOrDefaultParamValuesNodesComparator } from './nodeComparators/wildcardForAssignmentPatternOrDefaultParamValues'

export const beforeWildcardsComparators: NodesComparator[] = [
  wildcardForTypeKeywordsNodesComparator,
  wildcardForAssignmentPatternOrDefaultParamValuesNodesComparator,
]
