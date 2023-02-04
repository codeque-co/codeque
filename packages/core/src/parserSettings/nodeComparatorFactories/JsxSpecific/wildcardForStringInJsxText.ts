import { NodesComparator, WildcardUtils } from '../../../types'
import { regExpTest } from '../../../utils'

/*
 * Support for string wildcards in JSXText
 * Q: <A>$$</A>; C: <A>Some text</A>
 */
export const createWildcardForStringInJsxTextNodesComparator =
  ({ wildcardUtils }: { wildcardUtils: WildcardUtils }): NodesComparator =>
  (
    { fileNode, queryNode, searchSettings: { caseInsensitive } },
    _,
    { fileKeysToTraverseForOtherMatches, measureCompare },
  ) => {
    if (queryNode && fileNode) {
      if (
        (queryNode.type as string) === 'JSXText' &&
        (fileNode.type as string) === 'JSXText' &&
        regExpTest(
          wildcardUtils.anyStringWildcardRegExp,
          queryNode.value as string,
        )
      ) {
        const regex = wildcardUtils.patternToRegExp(
          queryNode.value as string,
          caseInsensitive,
        )
        const levelMatch = regExpTest(regex, fileNode.value as string)
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
