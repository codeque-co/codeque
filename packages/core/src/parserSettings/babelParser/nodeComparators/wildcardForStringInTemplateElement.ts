import { wildcardUtils } from '../common'
import { createWildcardForStringInTemplateElementNodesComparator } from '../../nodeComparatorFactories/JavaScriptSpecific/wildcardForStringInTemplateElement'

export const wildcardForStringInTemplateElement =
  createWildcardForStringInTemplateElementNodesComparator({
    wildcardUtils,
  })
