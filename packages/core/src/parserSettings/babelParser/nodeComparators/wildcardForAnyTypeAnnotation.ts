import { wildcardUtils } from '../common'
import { createWildcardForAnyTypeAnnotationNodesComparator } from '../../nodeComparatorFactories/TypeScriptSpecific/wildcardForAnyTypeAnnotation'

export const wildcardForAnyTypeAnnotation =
  createWildcardForAnyTypeAnnotationNodesComparator({
    wildcardUtils,
  })
