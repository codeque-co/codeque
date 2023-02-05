import { createWildcardForAnyImportNodesComparator } from '../../nodeComparatorFactories/JavaScriptSpecific/wildcardForAnyImport'
import { wildcardUtils } from '../common'

export const wildcardForAnyImport = createWildcardForAnyImportNodesComparator({
  wildcardUtils,
})
