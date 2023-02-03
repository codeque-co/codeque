import generate from '@babel/generator'
import { measureStart, regExpTest } from './utils'
import {
  IdentifierTypes,
  numericWildcard,
  identifierWildcard,
  nodesTreeWildcard,
  removeIdentifierRefFromWildcard,
  sortByLeastIdentifierStrength,
  anyStringWildcardRegExp,
  patternToRegex,
  babelParserSettings,
} from './parserRelatedUtils'
import {
  getExtendedCodeFrame,
  getKeyFromObject,
  prepareCodeResult,
} from './utils'
import { Logger } from './logger'
import { Match, Matches, Mode, PoorNodeType, NotNullParsedQuery } from './types'
import {
  isNodeArray,
  getKeysWithNodes,
  getSetsOfKeysToCompare,
} from './astUtils'

export type SearchSettings = {
  logger: Logger
  caseInsensitive: boolean
  mode: Mode
}

const validateMatch = (
  currentNode: PoorNodeType,
  currentQueryNode: PoorNodeType,
  settings: SearchSettings,
) => {
  const {
    mode,
    caseInsensitive,
    logger: { log, logStepEnd, logStepStart },
  } = settings

  const isExact = mode === 'exact'

  logStepStart('validate')

  const {
    levelMatch,
    queryKeysToTraverseForValidatingMatch,
    fileKeysToTraverseForValidatingMatch,
  } = compareNodes(currentNode, currentQueryNode, settings)

  if (
    fileKeysToTraverseForValidatingMatch.length !==
    queryKeysToTraverseForValidatingMatch.length
  ) {
    throw new Error(
      `Count of keys to validate in query and file does not match for nodes ${currentNode.type}:${currentNode?.name} ${currentQueryNode.type}:${currentQueryNode?.name}, [${fileKeysToTraverseForValidatingMatch}] [${queryKeysToTraverseForValidatingMatch}]`,
    )
  }

  if (
    fileKeysToTraverseForValidatingMatch.some((fileKey) => {
      return fileKey.includes('.')
    })
  ) {
    log('validating match with nested file key')
  }

  if (
    queryKeysToTraverseForValidatingMatch.some((queryKey) => {
      return queryKey.includes('.')
    })
  ) {
    log('validating match with nested query key')
  }

  if (!levelMatch) {
    try {
      log(
        'nodes incompat:\n\n',
        generate(currentNode as any).code,
        '\n\n',
        generate(currentQueryNode as any).code,
        '\n'.padEnd(10, '_'),
      )
    } catch (e) {
      log('nodes incompat:\n\n', 'invalid code')
    }

    return false
  } else {
    if (queryKeysToTraverseForValidatingMatch.length > 0) {
      for (let i = 0; i < queryKeysToTraverseForValidatingMatch.length; i++) {
        const queryKeyToTraverse = queryKeysToTraverseForValidatingMatch[i]
        const fileKeyToTraverse = fileKeysToTraverseForValidatingMatch[i]

        const queryValue = getKeyFromObject(
          currentQueryNode,
          queryKeyToTraverse,
        )
        const fileValue = getKeyFromObject(currentNode, fileKeyToTraverse)

        log('validate: queryKeyToTraverse', queryKeyToTraverse)
        log('validate: fileKeyToTraverse', fileKeyToTraverse)

        log('validate: query val', queryValue)
        log('validate: file val', fileValue)

        if (Array.isArray(fileValue as PoorNodeType[])) {
          log('validate: is array')
          const nodesArr = (fileValue as PoorNodeType[]).filter(
            babelParserSettings.shouldCompareNode,
          )
          const queryNodesArr = (queryValue as PoorNodeType[]).filter(
            babelParserSettings.shouldCompareNode,
          )

          if (isExact) {
            if (nodesArr.length !== queryNodesArr.length) {
              return false
            }

            for (let i = 0; i < nodesArr.length; i++) {
              const newCurrentNode = nodesArr[i]
              const newCurrentQueryNode = queryNodesArr[i]

              if (
                !newCurrentNode ||
                !newCurrentQueryNode ||
                !validateMatch(newCurrentNode, newCurrentQueryNode, settings)
              ) {
                return false
              }
            }
          } else {
            if (queryNodesArr.length > nodesArr.length) {
              return false
            }

            const matchedIndexes: number[] = []

            const queryNodesArrSorted = [...queryNodesArr].sort(
              sortByLeastIdentifierStrength,
            )

            for (let i = 0; i < queryNodesArrSorted.length; i++) {
              const queryNode = queryNodesArrSorted[i]

              for (let j = 0; j < nodesArr.length; j++) {
                const newCurrentNode = nodesArr[j]

                if (!matchedIndexes.includes(j)) {
                  if (validateMatch(newCurrentNode, queryNode, settings)) {
                    matchedIndexes.push(j)
                    break
                  }
                }
              }

              if (matchedIndexes.length !== i + 1) {
                return false
              }
            }

            if (mode === ('include-with-order' as Mode)) {
              const propsFoundInOrder = matchedIndexes.every(
                (val, idx, arr) => {
                  if (idx + 1 === arr.length) {
                    return true
                  } else {
                    return val < arr[idx + 1]
                  }
                },
              )

              if (
                !propsFoundInOrder ||
                matchedIndexes.length !== queryNodesArr.length
              ) {
                return false
              }
            } else {
              if (matchedIndexes.length !== queryNodesArr.length) {
                return false
              }
            }
          }
        } else {
          log('validate: is Node')

          const newCurrentNode = fileValue as PoorNodeType
          const newCurrentQueryNode = queryValue as PoorNodeType
          log('validate: newCurrentNode', newCurrentNode)
          log('validate: newCurrentQueryNode', newCurrentQueryNode)

          if (
            !newCurrentNode ||
            !newCurrentQueryNode ||
            !validateMatch(newCurrentNode, newCurrentQueryNode, settings)
          ) {
            return false
          }
        }
      }

      return true
    } else {
      return true
    }
  }
}

type CompareNodesReturnType = {
  levelMatch: boolean
  queryKeysToTraverseForValidatingMatch: string[]
  fileKeysToTraverseForValidatingMatch: string[]
  fileKeysToTraverseForOtherMatches: string[]
}

const keyWithPrefix = (prefix: string) => (key: string) =>
  prefix ? `${prefix}.${key}` : key

const compareNodes = (
  fileNode: PoorNodeType | null,
  queryNode: PoorNodeType | null,
  searchSettings: SearchSettings,
  /** Params used to support comparing nodes which are not on the same level */
  queryKeysPrefix = '',
  fileKeysPrefix = '',
): CompareNodesReturnType => {
  const {
    mode,
    caseInsensitive,
    logger: { log, logStepEnd, logStepStart },
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
            babelParserSettings.isNode,
          )
        : [],
    }
  }

  const [fileKeys, queryKeys, allFileKeys] = getSetsOfKeysToCompare(
    fileNode,
    queryNode,
    isExact,
    babelParserSettings.astPropsToSkip,
    babelParserSettings.isNodeFieldOptional,
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
    babelParserSettings.isNode,
  )

  babelParserSettings.sanitizeNode(fileNode)
  babelParserSettings.sanitizeNode(queryNode)

  if (
    (fileNode.type as string).includes('TS') &&
    (fileNode.type as string).includes('Keyword') &&
    (queryNode.type as string) === 'TSTypeReference' &&
    ((queryNode.typeName as any).name as string) === identifierWildcard &&
    (queryNode.typeParameters as any) === undefined
  ) {
    // support using '$$' wildcard for TS keywords like 'never', 'boolean' etc.
    // Since actual wildcard char is child of TSTypeReference (typeName), we have to hop one level deeper
    // otherwise level comparison will not work
    return {
      levelMatch: true,
      queryKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForOtherMatches,
    }
  }

  /*
    Support for matching function params with default value or object/array destructuring with default value

    Since we comparing query node with nested node from file, we have to do so before wildcards 
    comparison
  */
  if (
    !isExact &&
    (queryNode.type as string) === 'Identifier' &&
    (fileNode.type as string) === 'AssignmentPattern' &&
    (fileNode.left as PoorNodeType)?.type === 'Identifier'
  ) {
    log('comparing assignment pattern with identifier')

    // By comparing nodes this way, we support wildcards in compared identifiers
    return compareNodes(
      fileNode.left as PoorNodeType,
      queryNode,
      searchSettings,
      queryKeysMapper(''),
      fileKeysMapper('left'),
    )
  }

  // Support for wildcards in all nodes
  if (
    // refactor to use getWildcardFromNode, however this part does not have to be generic
    IdentifierTypes.includes(queryNode.type as string) &&
    (queryNode.name as string).includes(identifierWildcard)
  ) {
    log('comparing wildcard')
    let levelMatch

    const nameWithoutRef = removeIdentifierRefFromWildcard(
      queryNode.name as string,
    )

    if (nameWithoutRef === nodesTreeWildcard) {
      levelMatch = true
    } else {
      const regex = patternToRegex(nameWithoutRef, caseInsensitive)

      levelMatch =
        IdentifierTypes.includes(fileNode.type as string) &&
        regExpTest(regex, fileNode.name as string)

      if (isExact) {
        levelMatch =
          levelMatch &&
          typeof queryNode.typeAnnotation === typeof fileNode.typeAnnotation
      }
    }

    const queryKeysWithNodes = queryKeys.filter((key) => {
      const queryValue = queryNode[key]

      return (
        babelParserSettings.isNode(queryValue as PoorNodeType) ||
        isNodeArray(queryValue as PoorNodeType[], babelParserSettings.isNode)
      )
    })

    const queryKeysToTraverseForValidatingMatch =
      nameWithoutRef !== nodesTreeWildcard ? queryKeysWithNodes : []

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

  if (
    (queryNode.type as string) === 'ImportDefaultSpecifier' &&
    (queryNode.local as PoorNodeType).name === nodesTreeWildcard
  ) {
    // treat "import $$$ from '...'" as wildcard for any import
    measureCompare()

    return {
      levelMatch: true,
      queryKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForOtherMatches,
    }
  }

  if (
    (queryNode.type as string) === 'TSTypeReference' &&
    removeIdentifierRefFromWildcard(
      (queryNode.typeName as PoorNodeType).name as string,
    ) === nodesTreeWildcard
  ) {
    // in "const a: $$$; const a: () => $$$" treat $$$ as wildcard for any type annotation
    // also type T = $$$
    measureCompare()

    return {
      levelMatch: true,
      queryKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForOtherMatches,
    }
  }

  const isStringWithWildcard =
    (queryNode.type as string) === 'StringLiteral' &&
    (fileNode.type as string) === 'StringLiteral' &&
    regExpTest(anyStringWildcardRegExp, queryNode.value as string)

  log('isStringWithWildcard', isStringWithWildcard)

  // Support for wildcards in strings
  if (isStringWithWildcard) {
    const regex = patternToRegex(queryNode.value as string, caseInsensitive)
    const levelMatch = regExpTest(regex, fileNode.value as string)
    measureCompare()

    return {
      levelMatch: levelMatch,
      fileKeysToTraverseForValidatingMatch: [],
      queryKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForOtherMatches,
    }
  }

  // Support for string wildcards in JSXText
  if (
    (queryNode.type as string) === 'JSXText' &&
    (fileNode.type as string) === 'JSXText' &&
    regExpTest(anyStringWildcardRegExp, queryNode.value as string)
  ) {
    const regex = patternToRegex(queryNode.value as string, caseInsensitive)
    const levelMatch = regExpTest(regex, fileNode.value as string)
    measureCompare()

    return {
      levelMatch: levelMatch,
      fileKeysToTraverseForValidatingMatch: [],
      queryKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForOtherMatches,
    }
  }

  // Support for string wildcards in TemplateElements
  if (
    (queryNode.type as string) === 'TemplateElement' &&
    (fileNode.type as string) === 'TemplateElement' &&
    regExpTest(anyStringWildcardRegExp, (queryNode.value as any).raw as string)
  ) {
    const regex = patternToRegex(
      (queryNode.value as any).raw as string,
      caseInsensitive,
    )
    const levelMatch = regExpTest(regex, (fileNode.value as any).raw as string)
    measureCompare()

    return {
      levelMatch: levelMatch,
      fileKeysToTraverseForValidatingMatch: [],
      queryKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForOtherMatches,
    }
  }

  // Support for numeric wildcard
  if (
    (queryNode.type as string) === 'NumericLiteral' &&
    (fileNode.type as string) === 'NumericLiteral' &&
    ((queryNode.extra as any).raw as string) === numericWildcard
  ) {
    measureCompare()

    return {
      levelMatch: true,
      fileKeysToTraverseForValidatingMatch: [],
      queryKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForOtherMatches,
    }
  }

  // Support for matching object properties in destructuring before re-assignment
  if (
    !isExact &&
    // Both are ObjectProperty
    (queryNode.type as string) === 'ObjectProperty' &&
    (fileNode.type as string) === 'ObjectProperty' &&
    // Both has same key identifier
    (queryNode.key as PoorNodeType).type === 'Identifier' &&
    (fileNode.key as PoorNodeType).type === 'Identifier' &&
    (queryNode.key as PoorNodeType).name ===
      (fileNode.key as PoorNodeType).name &&
    // Both has different value identifier
    (queryNode.value as PoorNodeType).type === 'Identifier' &&
    (fileNode.value as PoorNodeType).type === 'Identifier' &&
    (queryNode.value as PoorNodeType).name !==
      (fileNode.value as PoorNodeType).name
  ) {
    // We skip comparing value if query does not have re-assignment
    const keysToTraverse = ['key']

    return {
      levelMatch: true,
      queryKeysToTraverseForValidatingMatch:
        keysToTraverse.map(queryKeysMapper),
      fileKeysToTraverseForValidatingMatch: keysToTraverse.map(fileKeysMapper),
      fileKeysToTraverseForOtherMatches,
    }
  }

  // Support for object property strings, identifiers and numbers comparison
  if (
    !isExact &&
    (queryNode.type as string) === 'ObjectProperty' &&
    (fileNode.type as string) === 'ObjectProperty' &&
    !(queryNode.method as boolean) &&
    !(fileNode.method as boolean)
  ) {
    // Key can be Identifier with `name` or String/Number with `value`
    const queryKeyValue =
      (queryNode.key as PoorNodeType).name ||
      (queryNode.key as PoorNodeType).value

    const fileKeyValue =
      (fileNode.key as PoorNodeType).name ||
      (fileNode.key as PoorNodeType).value

    // compare with == to automatically cast types
    if (queryKeyValue == fileKeyValue) {
      measureCompare()

      const keysToTraverse = ['value']

      return {
        levelMatch: true,
        queryKeysToTraverseForValidatingMatch:
          keysToTraverse.map(queryKeysMapper),
        fileKeysToTraverseForValidatingMatch:
          keysToTraverse.map(fileKeysMapper),
        fileKeysToTraverseForOtherMatches,
      }
    }
  }

  // Support for matching JSXElements without children regardless closing/opening tag
  if (
    !isExact &&
    (queryNode.type as string) === 'JSXElement' &&
    (fileNode.type as string) === 'JSXElement' &&
    (queryNode.children as []).length === 0
  ) {
    measureCompare()
    const keysToTraverse = ['openingElement']

    return {
      levelMatch: true,
      queryKeysToTraverseForValidatingMatch:
        keysToTraverse.map(queryKeysMapper),
      fileKeysToTraverseForValidatingMatch: keysToTraverse.map(fileKeysMapper),
      fileKeysToTraverseForOtherMatches,
    }
  }

  if (
    !isExact &&
    (queryNode.type as string) === 'JSXOpeningElement' &&
    (fileNode.type as string) === 'JSXOpeningElement'
  ) {
    measureCompare()
    const keysToTraverse = ['name', 'attributes']

    return {
      levelMatch: true,
      queryKeysToTraverseForValidatingMatch:
        keysToTraverse.map(queryKeysMapper),
      fileKeysToTraverseForValidatingMatch: keysToTraverse.map(fileKeysMapper),
      fileKeysToTraverseForOtherMatches,
    }
  }

  // Support for multi-statement search in program body

  if (
    (queryNode.type as string) === 'BlockStatement' &&
    (fileNode.type as string) === 'Program'
  ) {
    const keysToTraverse = ['body']

    return {
      levelMatch: true,
      queryKeysToTraverseForValidatingMatch:
        keysToTraverse.map(queryKeysMapper),
      fileKeysToTraverseForValidatingMatch: keysToTraverse.map(fileKeysMapper),
      fileKeysToTraverseForOtherMatches,
    }
  }

  // Support for matching JSXIdentifier using Identifier in query

  if (
    (queryNode.type as string) === 'Identifier' &&
    (fileNode.type as string) === 'JSXIdentifier' &&
    queryNode.name === fileNode.name
  ) {
    return {
      levelMatch: true,
      queryKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForOtherMatches,
    }
  }

  // Support for partial matching of template literals

  if (
    !isExact &&
    (queryNode.type as string) === 'TemplateElement' &&
    (fileNode.type as string) === 'TemplateElement' &&
    (queryNode.value as { raw?: string })?.raw?.length === 0
  ) {
    return {
      levelMatch: true,
      queryKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForOtherMatches,
    }
  }

  // Support for matching optional flag in MemberExpressions

  const memberExpressionsNodeTypes = [
    'MemberExpression',
    'OptionalMemberExpression',
  ]

  if (
    !isExact &&
    memberExpressionsNodeTypes.includes(queryNode.type as string) &&
    memberExpressionsNodeTypes.includes(fileNode.type as string) &&
    queryNode.computed === fileNode.computed // this could be also supported in more flexible way
  ) {
    /**
     We skip comparing 'optional' property on the nodes, to match them interchangeably
    */
    const keysToTraverseForValidatingMatch = ['object', 'property']

    return {
      levelMatch: true,
      queryKeysToTraverseForValidatingMatch: keysToTraverseForValidatingMatch,
      fileKeysToTraverseForValidatingMatch: keysToTraverseForValidatingMatch,
      fileKeysToTraverseForOtherMatches,
    }
  }

  if (queryNode.type === 'Identifier' && fileNode.type === 'Identifier') {
    if (
      queryNode.name !== fileNode.name &&
      fileNode.typeAnnotation !== undefined
    ) {
      log(
        'compare: Identifiers with different names, file type prop',
        fileNode.typeAnnotation,
      )

      log(
        'compare: Identifiers with different names, fileKeysToTraverse',
        fileKeysToTraverseForOtherMatches,
      )

      return {
        levelMatch: false,
        fileKeysToTraverseForValidatingMatch: [],
        queryKeysToTraverseForValidatingMatch: [],
        fileKeysToTraverseForOtherMatches,
      }
    }
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
      babelParserSettings.isNode(queryValue as PoorNodeType) ||
      isNodeArray(queryValue as PoorNodeType[], babelParserSettings.isNode) ||
      isNodeArray(fileValue as PoorNodeType[], babelParserSettings.isNode)
    ) {
      keysToTraverseForValidatingMatch.push(key)
    } else {
      primitivePropsCount++

      if (
        typeof queryValue === 'string' &&
        typeof fileValue === 'string' &&
        caseInsensitive
      ) {
        if (queryValue.toLocaleLowerCase() === fileValue.toLocaleLowerCase()) {
          matchingPrimitivePropsCount++
        }
      } else if (
        queryValue === fileValue ||
        JSON.stringify(queryValue) === JSON.stringify(fileValue)
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

const traverseAndMatch = (
  currentNode: PoorNodeType,
  queryNode: PoorNodeType,
  settings: SearchSettings,
) => {
  const {
    logger: { log, logStepEnd, logStepStart },
  } = settings

  logStepStart('traverse')
  const matches = []

  /**
   * LOOK FOR MATCH START
   */
  const { levelMatch, fileKeysToTraverseForOtherMatches } = compareNodes(
    currentNode,
    queryNode,
    settings,
  )

  const foundMatchStart = levelMatch

  /**
   * PROCESS CURRENT MATCH
   */

  if (foundMatchStart) {
    // We keep logs in IIFE to get the whole logic removed during build
    log(
      'foundMatchStart:\n',
      (() => {
        try {
          return generate(currentNode as any, {
            jsescOption: { compact: false },
            retainFunctionParens: true,
          }).code
        } catch (e) {
          // It's not possible to generate code for some nodes like TSTypeParameterInstantiation
          return `Could not generate code for node ${currentNode.type}`
        }
      })(),
      '\n',
      generate(queryNode as any).code,
      '\n'.padEnd(10, '_'),
    )

    const measureValidate = measureStart('validate')
    const match = validateMatch(currentNode, queryNode, settings)
    measureValidate()

    if (match) {
      matches.push({
        start: currentNode.start as number,
        end: currentNode.end as number,
        loc: currentNode.loc as Match['loc'],
        node: currentNode,
      } as Match)
    }
  }

  /**
   * TRAVERSE TO FIND NEW MATCHES START
   */

  const nestedMatches = fileKeysToTraverseForOtherMatches
    .map((key) => {
      if (currentNode[key] !== undefined) {
        if (babelParserSettings.isNode(currentNode[key] as PoorNodeType)) {
          return traverseAndMatch(
            currentNode[key] as PoorNodeType,
            queryNode,
            settings,
          )
        } else {
          return (currentNode[key] as PoorNodeType[]).map((node) =>
            traverseAndMatch(node, queryNode, settings),
          )
        }
      }

      return []
    })
    .flat(2) as Match[]

  logStepEnd('traverse')

  return [...matches, ...nestedMatches].flat()
}

type SearchFileContentArgs = SearchSettings & {
  queries: NotNullParsedQuery[]
  filePath: string
  fileContent: string
}

export const searchFileContent = ({
  queries,
  fileContent,
  filePath,
  ...settings
}: SearchFileContentArgs) => {
  const {
    logger: { log },
    caseInsensitive,
  } = settings

  const measureShallowSearch = measureStart('shallowSearch')

  const fileContentForTokensLookup = caseInsensitive
    ? fileContent.toLocaleLowerCase()
    : fileContent

  const includesUniqueTokens = queries.some(({ uniqueTokens }) =>
    uniqueTokens.every((token) => fileContentForTokensLookup.includes(token)),
  )
  measureShallowSearch()

  const uniqueTokens = queries.reduce(
    (tokens, { uniqueTokens }) => [...tokens, ...uniqueTokens],
    [] as string[],
  )
  log('Unique tokens', uniqueTokens)
  log(`Include unique tokes (${uniqueTokens.length}) ${includesUniqueTokens}`)

  const allMatches: Matches = []

  if (includesUniqueTokens) {
    const measureParseFile = measureStart('parseFile')

    const fileNode = babelParserSettings.parseCode(fileContent, filePath)

    measureParseFile()
    const programNode = fileNode.program as PoorNodeType
    const measureSearch = measureStart('search')

    for (const { queryNode, queryCode, isMultistatement } of queries) {
      const matches = traverseAndMatch(programNode, queryNode, settings).map(
        (match) => {
          if (!isMultistatement) {
            return match
          }
          /**
           * For multi-statement queries we search where exactly statements are located within parent node
           */

          const statements = queryNode.body as PoorNodeType[]

          const subMatches = statements
            .map((statement) =>
              traverseAndMatch(match.node, statement, settings),
            )
            .flat()
            .sort((matchA, matchB) => matchA.start - matchB.end)

          const firstSubMatch = subMatches[0]
          const lastSubMatch = subMatches[subMatches.length - 1]

          return {
            start: firstSubMatch.start,
            end: lastSubMatch.end,
            loc: {
              start: firstSubMatch.loc.start,
              end: lastSubMatch.loc.end,
            },
          }
        },
      )

      allMatches.push(
        ...matches.map((match) => {
          const code = prepareCodeResult({ fileContent, ...match })
          const [extendedCodeFrame, newStartLine] = getExtendedCodeFrame(
            match,
            fileContent,
          )

          return {
            filePath,
            ...match,
            query: queryCode,
            code,
            extendedCodeFrame: {
              code: extendedCodeFrame,
              startLine: match.loc.start.line + newStartLine,
            },
          }
        }),
      )
    }

    measureSearch()
  }

  return allMatches
}
