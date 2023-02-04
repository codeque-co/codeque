import { PoorNodeType, WildcardMeta, WildcardUtils } from './types'
import { nonIdentifierOrKeywordGlobal } from './utils'

export const createWildcardUtils = (
  identifierTypes: string[],
  numericWildcard: string,
  identifierWildcardBase: string,
  stringWildcardBase = identifierWildcardBase,
): WildcardUtils => {
  const identifierWildcard = identifierWildcardBase.repeat(2)
  const nodesTreeWildcard = identifierWildcardBase.repeat(3)

  const removeIdentifierRefFromWildcard = (name: string) => {
    const containsWildcardRegExp = new RegExp(`^\\${identifierWildcardBase}`)
    const removeIdRefRegExp = new RegExp(
      `(?<=(\\${identifierWildcardBase}){2,3})_(\\w)+$`,
    )

    if (containsWildcardRegExp.test(name)) {
      return name.replace(removeIdRefRegExp, '')
    }

    return name
  }

  const getWildcardRefFromIdentifierName = (name: string) => {
    const getRefRegExp = new RegExp(
      `(?<=(\\${identifierWildcardBase}){2,3}_)(\\w)+$`,
      'g',
    )

    const matchedRef = name.match(getRefRegExp)

    return matchedRef?.[0] || null
  }

  const getWildcardFromString = (
    maybeWildcardString: string,
  ): null | WildcardMeta => {
    const hasIdentifierWildcard =
      maybeWildcardString.includes(identifierWildcard)
    const hasNodeTreeWildcard = maybeWildcardString.includes(nodesTreeWildcard)
    const hasWildcard = hasIdentifierWildcard || hasNodeTreeWildcard

    if (hasWildcard) {
      const wildcardWithoutRef =
        removeIdentifierRefFromWildcard(maybeWildcardString)

      return {
        wildcardType: hasNodeTreeWildcard ? 'nodeTree' : 'identifier',
        wildcardWithRef: maybeWildcardString,
        wildcardWithoutRef,
        wildcardRef: getWildcardRefFromIdentifierName(maybeWildcardString),
      }
    }

    return null
  }

  const getWildcardFromNode = (node: PoorNodeType): null | WildcardMeta => {
    if (typeof node.type !== 'string') {
      return null
    }

    const isIdentifierNode =
      typeof node.type === 'string' && identifierTypes.includes(node.type)

    if (isIdentifierNode && typeof node.name === 'string') {
      return getWildcardFromString(node.name)
    }

    const isTypeReferenceNode = node.type === 'TSTypeReference'

    if (isTypeReferenceNode) {
      const maybeWildcardString = (node?.typeName as unknown as PoorNodeType)
        ?.name as string | undefined

      if (typeof maybeWildcardString === 'string') {
        return getWildcardFromString(maybeWildcardString)
      }
    }

    return null
  }

  const optionalStringWildcardRegExp = new RegExp(
    `\\${stringWildcardBase}\\${stringWildcardBase}`,
    'g',
  )
  const requiredStringWildcardRegExp = new RegExp(
    `\\${stringWildcardBase}\\${stringWildcardBase}\\${stringWildcardBase}`,
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
    anyStringWildcardRegExp: new RegExp(`(\\${stringWildcardBase}){2,3}`, 'g'),
    identifierWildcard,
    nodesTreeWildcard,
    numericWildcard,
    disallowedWildcardSequence: identifierWildcardBase.repeat(4),
    disallowedWildcardRegExp,
    removeIdentifierRefFromWildcard,
    getWildcardRefFromIdentifierName,
    getWildcardFromString,
    getWildcardFromNode,
    patternToRegExp,
  }
}
