import { WildcardUtils, WildcardMeta } from '../types'
import { regExpTest } from '../utils'
import { MatchContext } from '../matchContext'

export const matchStringOrIdentifierAliases = ({
  queryValue,
  fileValue,
  matchContext,
  wildcardsMeta,
  wildcardUtils,
  caseInsensitive,
}: {
  queryValue: string
  fileValue: string
  wildcardsMeta: WildcardMeta[]
  matchContext: MatchContext
  wildcardUtils: WildcardUtils
  caseInsensitive: boolean
}): boolean => {
  const { patternToRegExp, removeWildcardAliasesFromIdentifierName } =
    wildcardUtils

  const identifierNameWithWildcardsWithoutAliases =
    removeWildcardAliasesFromIdentifierName(queryValue)
  const regex = patternToRegExp(
    identifierNameWithWildcardsWithoutAliases,
    caseInsensitive,
  )
  /**
   * Check initial match of wildcards pattern
   */

  const wildcardMatch = regExpTest(regex, fileValue)

  let levelMatch = wildcardMatch

  if (wildcardMatch && wildcardsMeta.length > 0) {
    /**
     * If there are aliased wildcards, look for aliased values and match or assign new values
     */
    const queryNodeIdentifierNameWithWildcard = queryValue

    const fileNodeIdentifierName = fileValue

    /**
     * Creates named capturing group for alias, where alias is group name
     */
    const createAliasedIdentifierWildcardRegExp = (alias: string) =>
      `(?<${alias}>(\\w|-)*)`

    const createAliasedStringWildcardRegExp = (alias: string) =>
      `(?<${alias}>(.)*)`

    const identifierWildcardRegExp = '(\\w|-)*'
    const stringWildcardRegExp = '(.)*'

    /**
     * Compose regex that represents identifier name with aliased and non aliased wildcards
     */
    let wildcardValuesExtractionRegexText = queryNodeIdentifierNameWithWildcard

    wildcardsMeta.forEach(
      ({ wildcardAlias, wildcardWithAlias, wildcardType }) => {
        let regExpPart = identifierWildcardRegExp

        if (wildcardType === 'identifier' && wildcardAlias) {
          regExpPart = createAliasedIdentifierWildcardRegExp(wildcardAlias)
        } else if (wildcardType === 'string' && !wildcardAlias) {
          regExpPart = stringWildcardRegExp
        } else if (wildcardType === 'string' && wildcardAlias) {
          regExpPart = createAliasedStringWildcardRegExp(wildcardAlias)
        }

        wildcardValuesExtractionRegexText =
          wildcardValuesExtractionRegexText.replace(
            wildcardWithAlias,
            regExpPart,
          )
      },
    )

    const wildcardValuesExtractionRegex = new RegExp(
      wildcardValuesExtractionRegexText,
      caseInsensitive ? 'i' : undefined,
    )

    /**
     * Match file node content with wildcards regexp, so we can extract aliases values later
     */
    const wildcardValuesExtractionMatch = fileNodeIdentifierName.match(
      wildcardValuesExtractionRegex,
    )

    if (wildcardValuesExtractionMatch === null) {
      console.log(
        'wildcardValuesExtractionRegex',
        wildcardValuesExtractionRegex,
      )

      console.log('fileNodeIdentifierName', fileNodeIdentifierName)
      throw new Error(
        'Wildcard alias extraction RegExp did not match, thus it was build incorrectly.',
      )
    }

    /**
     * Compare wildcard aliases with values extracted from file node
     * - If alias value exist in match context, compare with value from file node
     * - If alias value does not exist, add it's value to match context
     */
    wildcardsMeta.forEach((wildcardMeta) => {
      const { wildcardAlias, wildcardWithAlias, wildcardType } = wildcardMeta

      if (wildcardAlias !== null) {
        const existingAlias = wildcardAlias
          ? matchContext.getIdentifierAlias(wildcardAlias) ||
            matchContext.getStringAlias(wildcardAlias)
          : null

        const aliasValue =
          wildcardValuesExtractionMatch?.groups?.[wildcardAlias] ?? ''

        if (existingAlias !== null) {
          const aliasMatches = caseInsensitive
            ? existingAlias.aliasValue.toLocaleLowerCase() ===
              aliasValue.toLocaleLowerCase()
            : existingAlias.aliasValue === aliasValue

          levelMatch = levelMatch && aliasMatches
        } else {
          if (wildcardType === 'identifier') {
            matchContext.addIdentifierAlias({
              alias: wildcardAlias,
              wildcard: wildcardWithAlias,
              aliasValue: aliasValue,
            })
          } else if (wildcardType === 'string') {
            matchContext.addStringAlias({
              alias: wildcardAlias,
              wildcard: wildcardWithAlias,
              aliasValue: aliasValue,
            })
          }
        }
      }
    })
  }

  return levelMatch
}
