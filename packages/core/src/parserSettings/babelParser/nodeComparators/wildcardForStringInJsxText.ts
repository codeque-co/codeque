import { wildcardUtils } from '../common'
import { createWildcardForStringInJsxTextNodesComparator } from '../../nodeComparatorFactories/JsxSpecific/wildcardForStringInJsxText'

export const wildcardForStringInJsxText =
  createWildcardForStringInJsxTextNodesComparator({
    wildcardUtils,
  })
