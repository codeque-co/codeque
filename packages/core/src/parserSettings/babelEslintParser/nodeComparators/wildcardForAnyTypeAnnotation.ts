import { createWildcardForAnyTypeAnnotationNodesComparator } from '../../nodeComparatorFactories/TypeScriptSpecific/wildcardForAnyTypeAnnotation'
import { wildcardUtils } from '../common'

export const wildcardForAnyTypeAnnotation =
  createWildcardForAnyTypeAnnotationNodesComparator({
    wildcardUtils,
  })
