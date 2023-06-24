import {
  compareAst,
  getKeysWithNodes,
  getSetsOfKeysToCompare,
  isNodeArray,
} from '../astUtils'
import {
  PoorNodeType,
  CompareNodesParams,
  CompareNodesReturnType,
  WildcardUtils,
  ParserSettings,
  WildcardMeta,
} from '../types'
import { measureStart, regExpTest } from '../utils'
import { MatchContext } from '../matchContext'

const keyWithPrefix = (prefix: string) => (key: string) =>
  prefix ? `${prefix}.${key}` : key

const matchStringOrIdentifierAliases = ({
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

export const compareNodes = (
  compareParams: CompareNodesParams,
): CompareNodesReturnType => {
  const {
    fileNode,
    queryNode,
    searchSettings,
    matchContext,
    /** Params used to support comparing nodes which are not on the same level */
    queryKeysPrefix = '',
    fileKeysPrefix = '',
  } = compareParams

  const {
    mode,
    caseInsensitive,
    logger: { log, logStepEnd, logStepStart },
    parserSettings,
    getCodeForNode = () => 'getCodeForNode not provided',
  } = searchSettings

  const queryKeysMapper = keyWithPrefix(queryKeysPrefix)
  const fileKeysMapper = keyWithPrefix(fileKeysPrefix)

  const measureCompare = measureStart('compare')
  logStepStart('compare')
  const isExact = mode === 'exact'

  if (!fileNode || !queryNode) {
    return {
      levelMatch: false,
      queryKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForOtherMatches: fileNode
        ? getKeysWithNodes(
            fileNode,
            Object.keys(fileNode),
            parserSettings.isNode,
          )
        : [],
    }
  }

  const [fileKeys, queryKeys, allFileKeys] = getSetsOfKeysToCompare(
    fileNode,
    queryNode,
    isExact,
    parserSettings.astPropsToSkip,
    parserSettings.isNodeFieldOptional,
  )

  log(
    'compare: query node type',
    queryNode.type,
    'file node type',
    fileNode.type,
  )

  log('compare: queryKeys', queryKeys)
  log('compare: fileKeys', fileKeys)

  const keysToTraverseForValidatingMatch: string[] = []
  const fileKeysToTraverseForOtherMatches: string[] = getKeysWithNodes(
    fileNode,
    /**
     * We always want to explore all other file for potential matches.
     * Even if note types are the same. Eg. Identifier might have another nested identifier node in type declaration
     */
    allFileKeys,
    parserSettings.isNode,
  )

  const compareUtils = {
    queryKeysMapper,
    fileKeysMapper,
    fileKeysToTraverseForOtherMatches,
    measureCompare,
  }

  const maybeCompareResult =
    parserSettings.compareNodesBeforeWildcardsComparison(
      compareParams,
      compareNodes,
      compareUtils,
    )

  if (maybeCompareResult) {
    return maybeCompareResult
  }

  const {
    isNode,
    isIdentifierNode,
    identifierTypeAnnotationFieldName,
    stringLikeLiteralUtils,
    numericLiteralUtils,
    programNodeAndBlockNodeUtils,
    getIdentifierNodeName,
    wildcardUtils: {
      getIdentifierWildcardsFromNode,
      getStringWildcardsFromString,
      anyStringWildcardRegExp,
      numericWildcard,
    },
  } = parserSettings

  {
    /**
     * START: GENERIC MATCHERS FOR BASE WILDCARDS
     */

    /**
     *  Support for wildcards in all nodes
     */
    if (isIdentifierNode(queryNode)) {
      const wildcardsMeta = getIdentifierWildcardsFromNode(queryNode)

      if (wildcardsMeta.length > 0) {
        log('comparing wildcard')

        const firstWildcard = wildcardsMeta[0]

        const isNodesTreeWildcard = firstWildcard.wildcardType === 'nodeTree'

        let levelMatch: boolean

        log('First Wildcard type', firstWildcard.wildcardType)
        log('wildcardWithoutAlias', firstWildcard.wildcardWithoutAlias)

        if (isNodesTreeWildcard) {
          levelMatch = true

          const { wildcardAlias, wildcardWithAlias } = firstWildcard

          /**
           * Check if alias has been already found
           */
          const existingAlias = wildcardAlias
            ? matchContext.getNodesTreeAlias(wildcardAlias)
            : null

          const matchedNode = fileNode

          if (existingAlias !== null) {
            /**
             * If alias exist, compare file nodes tree with matched alias nodes tree
             */
            const aliasMatches = compareAst(
              matchedNode,
              existingAlias.aliasNode,
              parserSettings,
            )

            levelMatch = levelMatch && aliasMatches
          } else if (wildcardAlias !== null) {
            /**
             * If alias not exist, add alias to match context
             */
            matchContext.addNodesTreeAlias({
              alias: wildcardAlias,
              wildcard: wildcardWithAlias,
              aliasNode: matchedNode,
              aliasValue: getCodeForNode(matchedNode, 'file'),
            })
          }
        } else {
          const queryValue = getIdentifierNodeName(queryNode)
          const fileValue = getIdentifierNodeName(fileNode)

          levelMatch =
            isIdentifierNode(fileNode) &&
            matchStringOrIdentifierAliases({
              queryValue,
              fileValue,
              wildcardsMeta,
              matchContext,
              wildcardUtils: parserSettings.wildcardUtils,
              caseInsensitive,
            })

          if (isExact && identifierTypeAnnotationFieldName) {
            levelMatch =
              levelMatch &&
              typeof queryNode[identifierTypeAnnotationFieldName] ===
                typeof fileNode[identifierTypeAnnotationFieldName]
          }
        }

        const queryKeysWithNodes = queryKeys.filter((key) => {
          const queryValue = queryNode[key]

          return (
            isNode(queryValue as PoorNodeType) ||
            isNodeArray(queryValue as PoorNodeType[], isNode)
          )
        })

        const queryKeysToTraverseForValidatingMatch = isNodesTreeWildcard
          ? []
          : queryKeysWithNodes

        measureCompare()

        return {
          levelMatch,
          queryKeysToTraverseForValidatingMatch:
            queryKeysToTraverseForValidatingMatch.map(queryKeysMapper),
          fileKeysToTraverseForValidatingMatch:
            queryKeysToTraverseForValidatingMatch.map(fileKeysMapper),
          fileKeysToTraverseForOtherMatches,
        }
      }
    }

    const isStringWithWildcard =
      stringLikeLiteralUtils.isStringLikeLiteralNode(queryNode) &&
      stringLikeLiteralUtils.isStringLikeLiteralNode(fileNode) &&
      queryNode.type === fileNode.type && // todo possibility to match string literals in other places (for include mode)
      regExpTest(
        anyStringWildcardRegExp,
        stringLikeLiteralUtils.getStringLikeLiteralValue(queryNode),
      )

    log('isStringWithWildcard', isStringWithWildcard)

    /**
     * Support for wildcards in strings
     *
     * Q: "some$$string"; C: "someBLABLAstring"; C: "somestring" // optional wildcard
     * Q: "some$$$string"; C: "someBLABLAstring"; // required wildcard
     * */
    if (isStringWithWildcard) {
      const queryNodeStringContent =
        stringLikeLiteralUtils.getStringLikeLiteralValue(queryNode)

      const fileNodeStringContent =
        stringLikeLiteralUtils.getStringLikeLiteralValue(fileNode)

      const wildcardsMeta = getStringWildcardsFromString(queryNodeStringContent)

      const levelMatch = matchStringOrIdentifierAliases({
        queryValue: queryNodeStringContent,
        fileValue: fileNodeStringContent,
        wildcardsMeta,
        matchContext,
        wildcardUtils: parserSettings.wildcardUtils,
        caseInsensitive,
      })

      measureCompare()

      return {
        levelMatch,
        fileKeysToTraverseForValidatingMatch: [],
        queryKeysToTraverseForValidatingMatch: [],
        fileKeysToTraverseForOtherMatches,
      }
    }

    /*
     * Support for numeric wildcard
     * Q: 0x0; C: 123; C: 0.123
     */
    if (
      numericLiteralUtils.isNumericLiteralNode(queryNode) &&
      numericLiteralUtils.isNumericLiteralNode(fileNode) &&
      numericLiteralUtils.getNumericLiteralValue(queryNode) === numericWildcard
    ) {
      measureCompare()

      return {
        levelMatch: true,
        fileKeysToTraverseForValidatingMatch: [],
        queryKeysToTraverseForValidatingMatch: [],
        fileKeysToTraverseForOtherMatches,
      }
    }

    /*
     * Support for multi-statement search in program body
     *
     * Multi-statement query is a block with statements, we want to match such block not only with other block statements, but also with top-level program node
     */

    if (
      programNodeAndBlockNodeUtils.isBlockNode(queryNode) &&
      programNodeAndBlockNodeUtils.isProgramNode(fileNode)
    ) {
      const queryKeysToTraverseForValidatingMatch = [
        fileKeysMapper(programNodeAndBlockNodeUtils.blockNodeBodyKey),
      ]

      const fileKeysToTraverseForValidatingMatch = [
        fileKeysMapper(programNodeAndBlockNodeUtils.programNodeBodyKey),
      ]

      return {
        levelMatch: true,
        queryKeysToTraverseForValidatingMatch,
        fileKeysToTraverseForValidatingMatch,
        fileKeysToTraverseForOtherMatches,
      }
    }
    /**
     * END: GENERIC MATCHERS FOR BASE WILDCARDS
     */
  }

  const maybeCompareResultAfterGeneric =
    parserSettings.compareNodesAfterWildcardsComparison(
      compareParams,
      compareNodes,
      compareUtils,
    )

  if (maybeCompareResultAfterGeneric) {
    return maybeCompareResultAfterGeneric
  }

  if (
    queryKeys.length !== fileKeys.length ||
    fileNode.type !== queryNode.type
  ) {
    measureCompare()

    return {
      levelMatch: false,
      fileKeysToTraverseForValidatingMatch: [],
      queryKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForOtherMatches,
    }
  }

  let primitivePropsCount = 0
  let matchingPrimitivePropsCount = 0

  queryKeys.forEach((key) => {
    const queryValue = queryNode[key]
    const fileValue = fileNode[key]

    if (
      parserSettings.isNode(queryValue as PoorNodeType) ||
      parserSettings.isNode(fileValue as PoorNodeType) ||
      isNodeArray(queryValue as PoorNodeType[], parserSettings.isNode) ||
      isNodeArray(fileValue as PoorNodeType[], parserSettings.isNode)
    ) {
      keysToTraverseForValidatingMatch.push(key)
    } else {
      primitivePropsCount++

      const sanitizedQueryValue = parserSettings.getSanitizedNodeValue(
        queryNode.type as string,
        key,
        queryValue,
      )
      const sanitizedFileValue = parserSettings.getSanitizedNodeValue(
        fileNode.type as string,
        key,
        fileValue,
      )

      if (
        typeof sanitizedQueryValue === 'string' &&
        typeof sanitizedFileValue === 'string' &&
        caseInsensitive
      ) {
        if (
          sanitizedQueryValue.toLocaleLowerCase() ===
          sanitizedFileValue.toLocaleLowerCase()
        ) {
          matchingPrimitivePropsCount++
        }
      } else if (
        sanitizedQueryValue === sanitizedFileValue ||
        JSON.stringify(sanitizedQueryValue) ===
          JSON.stringify(sanitizedFileValue)
      ) {
        matchingPrimitivePropsCount++
      }
    }
  })

  const queryKeysToTraverseForValidatingMatch =
    keysToTraverseForValidatingMatch.map(queryKeysMapper)
  const fileKeysToTraverseForValidatingMatch =
    keysToTraverseForValidatingMatch.map(fileKeysMapper)

  log(
    'compare: queryKeysToTraverseForValidatingMatch',
    queryKeysToTraverseForValidatingMatch,
  )

  log(
    'compare: fileKeysToTraverseForValidatingMatch',
    fileKeysToTraverseForValidatingMatch,
  )

  log(
    'compare: fileKeysToTraverseForOtherMatches',
    fileKeysToTraverseForOtherMatches,
  )

  logStepEnd('compare')
  measureCompare()

  return {
    levelMatch:
      primitivePropsCount !== 0 &&
      primitivePropsCount === matchingPrimitivePropsCount &&
      queryKeys.every((key) => fileKeys.includes(key)),
    queryKeysToTraverseForValidatingMatch,
    fileKeysToTraverseForValidatingMatch,
    fileKeysToTraverseForOtherMatches,
  }
}
