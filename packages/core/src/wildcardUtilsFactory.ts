import { PoorNodeType, WildcardMeta, WildcardUtils } from './types'
import { nonIdentifierOrKeywordGlobal, regExpTest } from './utils'

export const createWildcardUtils = (
  identifierNodeTypes: string[],
  numericWildcard: string,
  identifierWildcardBase: string,
  getIdentifierNodeName: (node: PoorNodeType) => string,
  getNodeType: (node: PoorNodeType) => string,
  stringWildcardBase = identifierWildcardBase,
): WildcardUtils => {
  const identifierWildcard = identifierWildcardBase.repeat(2)
  const nodesTreeWildcard = identifierWildcardBase.repeat(3)

  const createRemoveWildcardAliasesFromIdentifierName =
    (wildcardBase: string) => (name: string) => {
      const containsWildcardWithInvalidRefRegExp = new RegExp(
        `(\\${wildcardBase}){2,3}([a-zA-Z0-9])+_(\\${wildcardBase}){2,3}`,
      )

      const containsWildcardWithInvalidRefRegExp2 = new RegExp(
        `(\\${wildcardBase}){2,3}_([a-zA-Z0-9])+(\\${wildcardBase}){2,3}`,
      )

      const containsWildcardWithInvalidRefRegExp3 = new RegExp(
        `(\\${wildcardBase}){2,3}_([a-zA-Z0-9])+_(\\${wildcardBase}){2,3}`,
      )

      const removeIdRefRegExp = new RegExp(
        `(?<=(\\${wildcardBase}){2,3})_([a-zA-Z0-9])+(_)?`,
      )

      let nameWithRemovedWildcardsAliases = name

      while (
        regExpTest(removeIdRefRegExp, nameWithRemovedWildcardsAliases) &&
        !regExpTest(
          containsWildcardWithInvalidRefRegExp,
          nameWithRemovedWildcardsAliases,
        ) &&
        !regExpTest(
          containsWildcardWithInvalidRefRegExp2,
          nameWithRemovedWildcardsAliases,
        ) &&
        !regExpTest(
          containsWildcardWithInvalidRefRegExp3,
          nameWithRemovedWildcardsAliases,
        )
      ) {
        nameWithRemovedWildcardsAliases =
          nameWithRemovedWildcardsAliases.replace(removeIdRefRegExp, '')
      }

      return nameWithRemovedWildcardsAliases
    }

  const removeWildcardAliasesFromIdentifierName =
    createRemoveWildcardAliasesFromIdentifierName(identifierWildcardBase)

  const removeWildcardAliasesFromStringLiteral =
    createRemoveWildcardAliasesFromIdentifierName(stringWildcardBase)

  const getWildcardAliasFromWildcard = (name: string) => {
    const getRefRegExp = new RegExp(
      `(?<=(\\${identifierWildcardBase}){2,3})_([a-zA-Z0-9])+(?=(_?))`,
      'g',
    )

    const matchedRef = name.match(getRefRegExp)

    return matchedRef?.[0]?.replace(/_/g, '') || null
  }

  const getWildcardWithAliasFromIdentifierName = (name: string) => {
    const getRefRegExp = new RegExp(
      `((\\${identifierWildcardBase}){2,3}_([a-zA-Z0-9])+(_)?)|((\\${identifierWildcardBase}){2,3})`,
      'g',
    )

    const matchedWildcard = name.match(getRefRegExp)

    return matchedWildcard?.[0] as string
  }

  const hasWildcard = (maybeWildcardString: string) => {
    const hasIdentifierWildcard =
      maybeWildcardString.includes(identifierWildcard)
    const hasNodeTreeWildcard = maybeWildcardString.includes(nodesTreeWildcard)

    return hasIdentifierWildcard || hasNodeTreeWildcard
  }

  const getIdentifierWildcardsFromString = (
    maybeWildcardString: string,
  ): WildcardMeta[] => {
    let maybeWildcardStringToDecompose = maybeWildcardString
    const wildcardsMeta: WildcardMeta[] = []

    while (hasWildcard(maybeWildcardStringToDecompose)) {
      const hasNodeTreeWildcard =
        maybeWildcardStringToDecompose.includes(nodesTreeWildcard)

      const wildcardWithAlias = getWildcardWithAliasFromIdentifierName(
        maybeWildcardStringToDecompose,
      )

      const wildcardAlias = getWildcardAliasFromWildcard(wildcardWithAlias)

      const wildcardWithoutAlias =
        removeWildcardAliasesFromIdentifierName(wildcardWithAlias)

      wildcardsMeta.push({
        wildcardType: hasNodeTreeWildcard ? 'nodeTree' : 'identifier',
        wildcardWithAlias,
        wildcardWithoutAlias,
        wildcardAlias,
      })

      const wildcardEndIdx =
        maybeWildcardStringToDecompose.indexOf(wildcardWithAlias) +
        wildcardWithAlias.length

      maybeWildcardStringToDecompose =
        maybeWildcardStringToDecompose.substring(wildcardEndIdx)
    }

    return wildcardsMeta
  }

  const getIdentifierWildcardsFromNode = (
    node: PoorNodeType,
  ): WildcardMeta[] => {
    const nodeType = getNodeType(node)

    if (typeof nodeType !== 'string') {
      return []
    }

    const isIdentifierNode =
      typeof nodeType === 'string' && identifierNodeTypes.includes(nodeType)

    if (isIdentifierNode && typeof getIdentifierNodeName(node) === 'string') {
      return getIdentifierWildcardsFromString(getIdentifierNodeName(node))
    }

    /**
     * TODO: make it generic
     */
    const isTypeReferenceNode = nodeType === 'TSTypeReference'

    if (isTypeReferenceNode) {
      const maybeWildcardString = (node?.typeName as unknown as PoorNodeType)
        ?.name as string | undefined

      if (typeof maybeWildcardString === 'string') {
        return getIdentifierWildcardsFromString(maybeWildcardString)
      }
    }

    return []
  }

  const getStringWildcardsFromString = (content: string): WildcardMeta[] => {
    // Might need to have separate implementation for some other programming langs, good for now
    return getIdentifierWildcardsFromString(content).map(
      ({ wildcardType, ...rest }) => ({ wildcardType: 'string', ...rest }),
    )
  }

  const optionalStringWildcardRegExp = new RegExp(
    `\\${stringWildcardBase}\\${stringWildcardBase}`,
    'g',
  )
  const requiredStringWildcardRegExp = new RegExp(
    `\\${stringWildcardBase}\\${stringWildcardBase}\\${stringWildcardBase}`,
    'g',
  )

  const anyStringWildcardRegExp = new RegExp(
    `(\\${stringWildcardBase}){2,3}`,
    'g',
  )

  const disallowedWildcardRegExp = new RegExp(
    `(\\${identifierWildcardBase}){4,}(?!\\{)`,
  )

  const patternToRegExp = (str: string, caseInsensitive = false) => {
    if (disallowedWildcardRegExp.test(str)) {
      throw new Error(`More than 3 wildcards chars are not allowed "${str}"`)
    }

    const charsToEscape = str.match(nonIdentifierOrKeywordGlobal)
    let escapedString = str

    if (charsToEscape !== null) {
      const uniqueCharsToEscape = [...new Set(charsToEscape)]

      uniqueCharsToEscape.forEach((char) => {
        escapedString = escapedString.replace(
          new RegExp(`\\${char}`, 'g'),
          `\\${char}`,
        )
      })
    }

    const strWithReplacedWildcards = escapedString
      .replace(requiredStringWildcardRegExp, '.+?')
      .replace(optionalStringWildcardRegExp, '.*?')

    return new RegExp(
      `^${strWithReplacedWildcards}$`,
      caseInsensitive ? 'i' : undefined,
    )
  }

  return {
    optionalStringWildcardRegExp,
    requiredStringWildcardRegExp,
    anyStringWildcardRegExp,
    identifierWildcard,
    nodesTreeWildcard,
    numericWildcard,
    disallowedWildcardSequence: identifierWildcardBase.repeat(4),
    disallowedWildcardRegExp,
    removeWildcardAliasesFromIdentifierName,
    removeWildcardAliasesFromStringLiteral,
    getWildcardAliasFromWildcard,
    getIdentifierWildcardsFromString,
    getIdentifierWildcardsFromNode,
    getStringWildcardsFromString,
    patternToRegExp,
  }
}
