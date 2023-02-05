import { PoorNodeType, ParserSettings, WildcardUtils } from './types'
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

// parser specific, test util, can be generic if isNode, shouldCompare and sanitizeJSXText, astPropsToSkip are injected
export const cleanupAst = (
  ast: PoorNodeType,
  parserSettings: {
    isNode: ParserSettings['isNode']
    shouldCompareNode: ParserSettings['shouldCompareNode']
    astPropsToSkip: ParserSettings['astPropsToSkip']
    sanitizeNode: ParserSettings['sanitizeNode']
  },
) => {
  parserSettings.sanitizeNode(ast)

  const cleanedAst = removeKeysFromNode(ast, parserSettings.astPropsToSkip)

  Object.keys(cleanedAst).forEach((key) => {
    if (parserSettings.isNode(cleanedAst[key] as PoorNodeType)) {
      cleanedAst[key] = cleanupAst(
        cleanedAst[key] as PoorNodeType,
        parserSettings,
      )
    }

    if (isNodeArray(cleanedAst[key] as PoorNodeType[], parserSettings.isNode)) {
      cleanedAst[key] = (cleanedAst[key] as PoorNodeType[])
        .filter(parserSettings.shouldCompareNode)
        .map((subAst) => cleanupAst(subAst, parserSettings))
    }
  })

  return cleanedAst
}

export const compareCode = (
  codeA: string,
  codeB: string,
  parserSettings: {
    isNode: ParserSettings['isNode']
    shouldCompareNode: ParserSettings['shouldCompareNode']
    astPropsToSkip: ParserSettings['astPropsToSkip']
    parseCode: ParserSettings['parseCode']
    sanitizeNode: ParserSettings['sanitizeNode']
    getProgramNodeFromRootNode: ParserSettings['getProgramNodeFromRootNode']
  },
) => {
  const astA = parserSettings.getProgramNodeFromRootNode(
    parserSettings.parseCode(codeA),
  )

  const astB = parserSettings.getProgramNodeFromRootNode(
    parserSettings.parseCode(codeB),
  )

  const cleanedA = cleanupAst(astA, parserSettings)
  const cleanedB = cleanupAst(astB, parserSettings)

  return JSON.stringify(cleanedA) === JSON.stringify(cleanedB)
}

export const sortByLeastIdentifierStrength = (
  nodeA: PoorNodeType,
  nodeB: PoorNodeType,
  wildcardUtils: WildcardUtils,
) => {
  const aWildcard = wildcardUtils.getWildcardFromNode(nodeA)
  const bWildcard = wildcardUtils.getWildcardFromNode(nodeB)

  const aIsIdentifierWithWildcard = aWildcard !== null
  const bIsIdentifierWithWildcard = bWildcard !== null

  if (aIsIdentifierWithWildcard && bIsIdentifierWithWildcard) {
    const idA = aWildcard.wildcardWithoutRef
    const idB = bWildcard.wildcardWithoutRef

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

  if (aIsIdentifierWithWildcard) {
    return 1
  }

  if (bIsIdentifierWithWildcard) {
    return -1
  }

  return 0
}
