import {
  getKeysWithNodes,
  getSetsOfKeysToCompare,
  isNodeArray,
} from '../astUtils'
import { babelParserSettings, IdentifierTypes } from '../parserRelatedUtils'
import { PoorNodeType, SearchSettings } from '../types'
import { measureStart, regExpTest } from '../utils'

type CompareNodesReturnType = {
  levelMatch: boolean
  queryKeysToTraverseForValidatingMatch: string[]
  fileKeysToTraverseForValidatingMatch: string[]
  fileKeysToTraverseForOtherMatches: string[]
}

const keyWithPrefix = (prefix: string) => (key: string) =>
  prefix ? `${prefix}.${key}` : key

export const compareNodes = (
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

  // TS family specific,can be parametrized and reused
  /*
   * support using '$$' wildcard for TS keywords like 'never', 'boolean' etc.
   * Since actual wildcard char is child of TSTypeReference (typeName), we have to hop one level deeper
   * otherwise level comparison will not work
   */
  if (
    (fileNode.type as string).includes('TS') &&
    (fileNode.type as string).includes('Keyword') &&
    (queryNode.type as string) === 'TSTypeReference' &&
    ((queryNode.typeName as any).name as string) ===
      babelParserSettings.wildcardUtils.identifierWildcard &&
    (queryNode.typeParameters as any) === undefined
  ) {
    return {
      levelMatch: true,
      queryKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForOtherMatches,
    }
  }

  // JS family specific, perhaps can be parametrized and reused
  /**
   * Support for matching function params with default value or object/array destructuring with default value
   *
   *   Since we comparing query node with nested node from file, we have to do so before wildcards
   *  comparison
   * TODO: code example
   *
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

  // Should be generic for all languages, we have to parametrize typeAnnotation field name
  /**
   *  Support for wildcards in all nodes
   * */
  if (
    // refactor to use getWildcardFromNode, however this part does not have to be generic
    IdentifierTypes.includes(queryNode.type as string) &&
    (queryNode.name as string).includes(
      babelParserSettings.wildcardUtils.identifierWildcard,
    )
  ) {
    log('comparing wildcard')
    let levelMatch

    const nameWithoutRef =
      babelParserSettings.wildcardUtils.removeIdentifierRefFromWildcard(
        queryNode.name as string,
      )

    if (
      nameWithoutRef === babelParserSettings.wildcardUtils.nodesTreeWildcard
    ) {
      levelMatch = true
    } else {
      const regex = babelParserSettings.wildcardUtils.patternToRegExp(
        nameWithoutRef,
        caseInsensitive,
      )

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
      nameWithoutRef !== babelParserSettings.wildcardUtils.nodesTreeWildcard
        ? queryKeysWithNodes
        : []

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

  // JS family specific, should be parametrized and reused
  /**
   * treat "import $$$ from '...'" as wildcard for any import
   * */
  if (
    (queryNode.type as string) === 'ImportDefaultSpecifier' &&
    (queryNode.local as PoorNodeType).name ===
      babelParserSettings.wildcardUtils.nodesTreeWildcard
  ) {
    measureCompare()

    return {
      levelMatch: true,
      queryKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForOtherMatches,
    }
  }

  // TS family specific, should be parametrized and reused
  /**
   * Support for $$$ wildcards for any type annotation
   * in "const a: $$$; const a: () => $$$" treat $$$ as wildcard for any type annotation
   * also type T = $$$
   */
  if (
    (queryNode.type as string) === 'TSTypeReference' &&
    babelParserSettings.wildcardUtils.removeIdentifierRefFromWildcard(
      (queryNode.typeName as PoorNodeType).name as string,
    ) === babelParserSettings.wildcardUtils.nodesTreeWildcard
  ) {
    measureCompare()

    return {
      levelMatch: true,
      queryKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForValidatingMatch: [],
      fileKeysToTraverseForOtherMatches,
    }
  }

  // this should be extracted to parser settings
  const isStringWithWildcard =
    (queryNode.type as string) === 'StringLiteral' &&
    (fileNode.type as string) === 'StringLiteral' &&
    regExpTest(
      babelParserSettings.wildcardUtils.anyStringWildcardRegExp,
      queryNode.value as string,
    )

  log('isStringWithWildcard', isStringWithWildcard)

  // Should be generic
  /**
   * Support for wildcards in strings
   * TODO: code example
   *
   * */
  if (isStringWithWildcard) {
    const regex = babelParserSettings.wildcardUtils.patternToRegExp(
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

  // JSX-family specific, should be parametrized and reused
  /*
   * Support for string wildcards in JSXText
   * TODO: code example
   */
  if (
    (queryNode.type as string) === 'JSXText' &&
    (fileNode.type as string) === 'JSXText' &&
    regExpTest(
      babelParserSettings.wildcardUtils.anyStringWildcardRegExp,
      queryNode.value as string,
    )
  ) {
    const regex = babelParserSettings.wildcardUtils.patternToRegExp(
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

  // JS-family specific, Should be parametrized and reused
  /**
   *  Support for string wildcards in TemplateElements
   * TODO: code example
   *
   * */
  if (
    (queryNode.type as string) === 'TemplateElement' &&
    (fileNode.type as string) === 'TemplateElement' &&
    regExpTest(
      babelParserSettings.wildcardUtils.anyStringWildcardRegExp,
      (queryNode.value as any).raw as string,
    )
  ) {
    const regex = babelParserSettings.wildcardUtils.patternToRegExp(
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

  // Should be generic, function to check if node is Numeric wildcard should be added to parser settings
  /*
   * Support for numeric wildcard
   * TODO: code example
   */
  if (
    (queryNode.type as string) === 'NumericLiteral' &&
    (fileNode.type as string) === 'NumericLiteral' &&
    ((queryNode.extra as any).raw as string) ===
      babelParserSettings.wildcardUtils.numericWildcard
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
   * Support for matching object properties in destructuring before re-assignment
   * TODO: code example
   */
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

  // JS-family specific, should be parametrized and re-used
  /**
   * Support for object property strings, identifiers and numbers comparison
   * TODO: code example
   *
   */
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

  // JSX-family specific, should be parametrized and reused
  /**
   *
   * 1/2 Support for matching JSXElements without children regardless closing/opening tag
   * TODO: code example
   *
   */
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

  /**
   * 2/2 Support for matching JSXElements without children regardless closing/opening tag
   * TODO: code example
   *
   */
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

  // should be generic, need to parametrise node names and body prop
  /*
   * Support for multi-statement search in program body
   * TODO: code example
   */

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

  // JSX-family specific, should be parametrized and reused
  /**
   * Support for matching JSXIdentifier using Identifier in query
   * TODO: code example
   */

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

  // JS-family specific, should be parametrized and reused
  /*
   * Support for partial matching of template literals
   * TODO: code example
   */
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

  // JS-family specific, should be parametrized and reused
  /*
   * Support for matching optional flag in MemberExpressions
   * TODO: code example
   */

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

  //Ts-family specific, should be parametrized and re-used
  /**
   * Support for further processing of function argument or variable declaration with type annotation
   * to support matching the type annotation with wildcard
   *
   * Q: $$SomeType
   * C: const a:MySomeType = {}
   * C: function(a:MySomeType) {}
   */
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

  // The rest is generic

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
