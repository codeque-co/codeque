import { MatchContextAliases } from './matchContext'
import { Match, ParserSettings, PoorNodeType, WildcardUtils } from './types'
import { isNullOrUndef } from './utils'

export const isNodeArray = (
  maybeNodeArr: PoorNodeType[],
  isNode: ParserSettings['isNode'],
) => {
  return (
    Array.isArray(maybeNodeArr) &&
    maybeNodeArr.length > 0 &&
    isNode(maybeNodeArr[0])
  )
}

export const getKeysWithNodes = (
  node: PoorNodeType,
  nodeKeys: string[],
  isNode: ParserSettings['isNode'],
) => {
  return nodeKeys.filter((key) => {
    const fileValue = node[key]

    return (
      isNode(fileValue as PoorNodeType) ||
      isNodeArray(fileValue as PoorNodeType[], isNode)
    )
  })
}

const isNodeKey = (
  node: PoorNodeType,
  key: string,
  keysToCheck: ParserSettings['astPropsToSkip'],
) =>
  key.startsWith('__') ||
  keysToCheck.some((keyToCheck) =>
    typeof keyToCheck === 'string'
      ? key === keyToCheck
      : node.type === keyToCheck.type && keyToCheck.key === key,
  )

export const getKeysToCompare = (
  node: PoorNodeType,
  astPropsToSkip: ParserSettings['astPropsToSkip'],
) => {
  return Object.keys(node).filter(
    (key) => !isNodeKey(node, key, astPropsToSkip),
  )
}

export const getSetsOfKeysToCompare = (
  fileNode: PoorNodeType,
  queryNode: PoorNodeType,
  isExact: boolean,
  astPropsToSkip: ParserSettings['astPropsToSkip'],
  isNodeFieldOptional: ParserSettings['isNodeFieldOptional'],
) => {
  const allFileKeys = getKeysToCompare(fileNode, astPropsToSkip)
  const allQueryKeys = getKeysToCompare(queryNode, astPropsToSkip)

  if (isExact || fileNode.type !== queryNode.type) {
    return [allFileKeys, allQueryKeys, allFileKeys, allQueryKeys]
  }

  /**
   *  If in include mode and file and query nodes are of the same type
   *    Exclude from file node all properties that
   *    - are not present on query node or their value is falsy on query node (not specified)
   *    - and are marked as optional in babel types
   *    - or are `tail` property from TemplateElement
   */

  const fileKeysToRemove = allFileKeys.filter(
    (fileKey) =>
      (!allQueryKeys.includes(fileKey) || isNullOrUndef(queryNode[fileKey])) &&
      isNodeFieldOptional(fileNode.type as string, fileKey),
  )

  const includeFileKeys = allFileKeys.filter(
    (fileKey) => !fileKeysToRemove.includes(fileKey),
  )

  // exclude all properties that has falsy value (otherwise properties set does not mach, if we remove these properties from file node)
  const includeQueryKeys = allQueryKeys.filter(
    (queryKey) =>
      !fileKeysToRemove.includes(queryKey) &&
      !isNullOrUndef(queryNode[queryKey]),
  )

  return [includeFileKeys, includeQueryKeys, allFileKeys, allQueryKeys]
}

const removeKeysFromNode = (
  obj: PoorNodeType,
  keys: ParserSettings['astPropsToSkip'],
) => {
  const newObj = {} as PoorNodeType

  Object.entries(obj).forEach(([key, val]) => {
    if (!isNodeKey(obj, key, keys)) {
      newObj[key] = val
    }
  })

  return newObj
}

export const cleanupAst = (
  ast: PoorNodeType,
  parserSettings: {
    isNode: ParserSettings['isNode']
    shouldCompareNode: ParserSettings['shouldCompareNode']
    astPropsToSkip: ParserSettings['astPropsToSkip']
    getSanitizedNodeValue: ParserSettings['getSanitizedNodeValue']
  },
) => {
  const cleanedAst = removeKeysFromNode(ast, parserSettings.astPropsToSkip)

  Object.keys(cleanedAst).forEach((key) => {
    if (parserSettings.isNode(cleanedAst[key] as PoorNodeType)) {
      cleanedAst[key] = cleanupAst(
        cleanedAst[key] as PoorNodeType,
        parserSettings,
      )
    } else if (
      isNodeArray(cleanedAst[key] as PoorNodeType[], parserSettings.isNode)
    ) {
      cleanedAst[key] = (cleanedAst[key] as PoorNodeType[])
        .filter(parserSettings.shouldCompareNode)
        .map((subAst) => cleanupAst(subAst, parserSettings))
    } else {
      cleanedAst[key] = parserSettings.getSanitizedNodeValue(
        cleanedAst.type as string,
        key,
        cleanedAst[key],
      )
    }
  })

  return cleanedAst
}

type CompareCodeParserSettingsSubset = {
  isNode: ParserSettings['isNode']
  shouldCompareNode: ParserSettings['shouldCompareNode']
  astPropsToSkip: ParserSettings['astPropsToSkip']
  parseCode: ParserSettings['parseCode']
  getSanitizedNodeValue: ParserSettings['getSanitizedNodeValue']
  getProgramNodeFromRootNode: ParserSettings['getProgramNodeFromRootNode']
}

export const compareCode = (
  codeA: string,
  codeB: string,
  parserSettingsSubset: CompareCodeParserSettingsSubset,
) => {
  const astA = parserSettingsSubset.getProgramNodeFromRootNode(
    parserSettingsSubset.parseCode(codeA),
  )

  const astB = parserSettingsSubset.getProgramNodeFromRootNode(
    parserSettingsSubset.parseCode(codeB),
  )

  return compareAst(astA, astB, parserSettingsSubset)
}

const cloneAst = (ast: PoorNodeType) => {
  const uniqueObjectLikeValuesCache: unknown[] = []

  /**
   * Skip circular references (like '__parent')
   */
  const stringified = JSON.stringify(ast, (_: string, value: unknown) => {
    if (typeof value === 'object' && value !== null) {
      // Duplicate reference found, discard key
      if (uniqueObjectLikeValuesCache.includes(value)) return

      // Store value in our collection
      uniqueObjectLikeValuesCache.push(value)
    }

    return value
  })

  return JSON.parse(stringified)
}

export const compareAst = (
  astA: PoorNodeType,
  astB: PoorNodeType,
  parserSettingsSubset: CompareCodeParserSettingsSubset,
) => {
  const cleanedA = cleanupAst(cloneAst(astA), parserSettingsSubset)
  const cleanedB = cleanupAst(cloneAst(astB), parserSettingsSubset)

  return JSON.stringify(cleanedA) === JSON.stringify(cleanedB)
}

export const sortByLeastIdentifierStrength = (
  nodeA: PoorNodeType,
  nodeB: PoorNodeType,
  wildcardUtils: WildcardUtils,
  getIdentifierNodeName: (node: PoorNodeType) => string,
) => {
  const aWildcards = wildcardUtils.getIdentifierWildcardsFromNode(nodeA)
  const bWildcards = wildcardUtils.getIdentifierWildcardsFromNode(nodeB)

  const aIsIdentifierWithWildcards = aWildcards.length > 0
  const bIsIdentifierWithWildcards = bWildcards.length > 0

  if (aIsIdentifierWithWildcards && bIsIdentifierWithWildcards) {
    const idA = wildcardUtils.removeWildcardAliasesFromIdentifierName(
      getIdentifierNodeName(nodeA),
    )
    const idB = wildcardUtils.removeWildcardAliasesFromIdentifierName(
      getIdentifierNodeName(nodeB),
    )

    if (idA === idB) {
      return 0
    }

    if (idA === wildcardUtils.nodesTreeWildcard) {
      return 1
    }

    if (idB === wildcardUtils.nodesTreeWildcard) {
      return -1
    }

    const aNonWildcardCharsLen = idA
      .split(wildcardUtils.identifierWildcard)
      .map((str) => str.length)
      .reduce((sum, len) => sum + len, 0)
    const bNonWildcardCharsLen = idB
      .split(wildcardUtils.identifierWildcard)
      .map((str) => str.length)
      .reduce((sum, len) => sum + len, 0)

    return bNonWildcardCharsLen - aNonWildcardCharsLen
  }

  if (aIsIdentifierWithWildcards) {
    return 1
  }

  if (bIsIdentifierWithWildcards) {
    return -1
  }

  return 0
}

export const getMatchFromNode = (
  node: PoorNodeType,
  parserSettings: Pick<ParserSettings, 'getNodePosition'>,
  aliases: MatchContextAliases,
) =>
  ({
    ...parserSettings.getNodePosition(node),
    node,
    aliases,
  } as Match)

export const getVisitorKeysForQueryNodeType = (
  queryNodeType: string,
  parserSettings: Pick<ParserSettings, 'alternativeNodeTypes'>,
) => {
  return [
    queryNodeType,
    ...(parserSettings.alternativeNodeTypes[queryNodeType] ?? []),
  ]
}
