import { NodesComparator, WildcardUtils } from '../../../types'
import { regExpTest } from '../../../utils'

/**
 *  Support for string wildcards in TemplateElements
 *  Q: `${val}$$`; C: `${val}some text`
 *
 * */
export const createWildcardForStringInTemplateElementNodesComparator =
  ({ wildcardUtils }: { wildcardUtils: WildcardUtils }): NodesComparator =>
  (
    { queryNode, fileNode, searchSettings: { caseInsensitive } },
    _,
    { fileKeysToTraverseForOtherMatches, measureCompare },
  ) => {
    if (queryNode && fileNode) {
      if (
        (queryNode.type as string) === 'TemplateElement' &&
        (fileNode.type as string) === 'TemplateElement' &&
        regExpTest(
          wildcardUtils.anyStringWildcardRegExp,
          (queryNode.value as any).raw as string,
        )
      ) {
        const regex = wildcardUtils.patternToRegExp(
          (queryNode.value as any).raw as string,
          caseInsensitive,
        )
        const levelMatch = regExpTest(
          regex,
          (fileNode.value as any).raw as string,
        )
        measureCompare()

        return {
          levelMatch: levelMatch,
          fileKeysToTraverseForValidatingMatch: [],
          queryKeysToTraverseForValidatingMatch: [],
          fileKeysToTraverseForOtherMatches,
        }
      }
    }
  }
