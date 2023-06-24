import { createWildcardForTypeKeywordNodesComparator } from '../../nodeComparatorFactories/TypeScriptSpecific/wildcardForTypeKeywords'
import { wildcardUtils } from '../common'

export const wildcardForTypeKeywordsNodesComparator =
  createWildcardForTypeKeywordNodesComparator({ wildcardUtils })
