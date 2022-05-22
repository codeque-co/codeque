import fs from 'fs'
import { parse } from '@babel/parser'
import generate from '@babel/generator'
import {
  createLogger,
  Mode,
  measureStart,
  patternToRegex,
  regExpTest
} from './utils'
import { parseQueries } from './parseQuery'
import {
  getBody,
  getSetsOfKeysToCompare,
  sanitizeJSXText,
  isNode,
  isNodeArray,
  IdentifierTypes,
  Match,
  PoorNodeType,
  parseOptions,
  numericWildcard,
  identifierWildcard,
  nodesTreeWildcard,
  removeIdentifierRefFromWildcard,
  sortByLeastIdentifierStrength,
  prepareCodeResult,
  shouldCompareNode,
  anyStringWildcardRegExp
} from './astUtils'
import { getExtendedCodeFrame } from '/utils'

export type SearchArgs = {
  filePaths: string[]
  queryCodes: string[]
  mode: Mode
  caseInsensitive?: boolean
  debug?: boolean
}

export type ExtendedCodeFrame = {
  code: string
  startLine: number
}

export type Matches = Array<
  Match & { filePath: string; extendedCodeFrame?: ExtendedCodeFrame }
>

export type SearchResults = {
  matches: Matches
  errors: Array<any>
}

const dedupMatches = (
  matches: Matches,
  log: (...args: any[]) => void,
  debug = false
): Matches => {
  const deduped: Matches = []

  matches.forEach((match) => {
    const alreadyIn = deduped.some((_match) => {
      return (
        match.filePath === _match.filePath &&
        match.start === _match.start &&
        match.end === _match.end
      )
    })

    if (!alreadyIn) {
      deduped.push(match)
    } else if (debug) {
      log('already in', match.code, match.query)
    }
  })

  return deduped
}

export const search = ({
  mode,
  filePaths,
  queryCodes,
  caseInsensitive = false,
  debug = false
}: SearchArgs): SearchResults => {
  const { log, logStepEnd, logStepStart } = createLogger(debug)
  const allMatches: Matches = []
  const isExact = mode === ('exact' as Mode)
  log('Parse query')
  const measureParseQuery = measureStart('parseQuery')

  const [queries, parseOk] = parseQueries(queryCodes, caseInsensitive)

  if (!parseOk) {
    return {
      matches: [],
      errors: queries.filter((queryResult) => queryResult.error)
    }
  }
  const searchErrors = []
  measureParseQuery()

  log(
    'inputQueryNode',
    queries.map(({ queryNode }) => queryNode)
  )

  const compareNodes = (fileNode: PoorNodeType, queryNode: PoorNodeType) => {
    const measureCompare = measureStart('compare')
    logStepStart('compare')

    const [fileKeys, queryKeys] = getSetsOfKeysToCompare(
      fileNode,
      queryNode,
      isExact
    )

    log('compare: node type', fileNode.type)

    log('compare: queryKeys', queryKeys)
    log('compare: fileKeys', fileKeys)

    const queryKeysToTraverse: string[] = []
    const fileKeysToTraverse: string[] = []

    if (fileNode.type === 'JSXText') {
      log('pre JSX Text', fileNode.value)
      sanitizeJSXText(fileNode)
      log('sanitized JSX Text', fileNode.value)
    }

    if (queryNode.type === 'JSXText') {
      sanitizeJSXText(queryNode)
    }

    fileKeys.forEach((key) => {
      const fileValue = fileNode[key]
      if (
        isNode(fileValue as PoorNodeType) ||
        isNodeArray(fileValue as PoorNodeType[])
      ) {
        fileKeysToTraverse.push(key)
      }
    })

    if (
      (fileNode.type as string).includes('TS') &&
      (fileNode.type as string).includes('Keyword') &&
      (queryNode.type as string) === 'TSTypeReference' &&
      ((queryNode.typeName as any).name as string) === identifierWildcard &&
      (queryNode.typeParameters as any) === undefined
    ) {
      // support using '$$' wildcard for TS keywords like 'never', 'boolean' etc.
      return {
        levelMatch: true,
        queryKeysToTraverse: [],
        fileKeysToTraverse
      }
    }
    if (
      IdentifierTypes.includes(queryNode.type as string) &&
      (queryNode.name as string).includes(identifierWildcard)
    ) {
      let levelMatch

      const nameWithoutRef = removeIdentifierRefFromWildcard(
        queryNode.name as string
      )
      if (nameWithoutRef === nodesTreeWildcard) {
        levelMatch = true
      } else {
        const regex = patternToRegex(nameWithoutRef, caseInsensitive)
        levelMatch =
          fileNode.type === queryNode.type &&
          regex.test(fileNode.name as string)

        if (isExact) {
          levelMatch =
            levelMatch &&
            typeof queryNode.typeAnnotation === typeof fileNode.typeAnnotation
        }
      }

      const queryKeysWithNodes = queryKeys.filter((key) => {
        const queryValue = queryNode[key]
        return (
          isNode(queryValue as PoorNodeType) ||
          isNodeArray(queryValue as PoorNodeType[])
        )
      })

      const queryKeysToTraverse =
        nameWithoutRef !== nodesTreeWildcard ? queryKeysWithNodes : []

      measureCompare()
      return {
        levelMatch,
        queryKeysToTraverse,
        fileKeysToTraverse
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
        queryKeysToTraverse: [],
        fileKeysToTraverse
      }
    }
    log('bla bla')

    if (
      (queryNode.type as string) === 'TSTypeReference' &&
      removeIdentifierRefFromWildcard(
        (queryNode.typeName as PoorNodeType).name as string
      ) === nodesTreeWildcard
    ) {
      // in "const a: $$$; const a: () => $$$" treat $$$ as wildcard for any type annotation
      // also type T = $$$
      measureCompare()
      return {
        levelMatch: true,
        queryKeysToTraverse: [],
        fileKeysToTraverse
      }
    }

    const isStringWithWildcard =
      (queryNode.type as string) === 'StringLiteral' &&
      (fileNode.type as string) === 'StringLiteral' &&
      regExpTest(anyStringWildcardRegExp, queryNode.value as string)

    log('isStringWithWildcard', isStringWithWildcard)
    if (isStringWithWildcard) {
      const regex = patternToRegex(queryNode.value as string, caseInsensitive)
      const levelMatch = regex.test(fileNode.value as string)
      measureCompare()
      return {
        levelMatch: levelMatch,
        queryKeysToTraverse: [],
        fileKeysToTraverse
      }
    }

    if (
      (queryNode.type as string) === 'JSXText' &&
      (fileNode.type as string) === 'JSXText' &&
      regExpTest(anyStringWildcardRegExp, queryNode.value as string)
    ) {
      const regex = patternToRegex(queryNode.value as string, caseInsensitive)
      const levelMatch = regex.test(fileNode.value as string)
      measureCompare()
      return {
        levelMatch: levelMatch,
        queryKeysToTraverse: [],
        fileKeysToTraverse
      }
    }

    if (
      (queryNode.type as string) === 'TemplateElement' &&
      (fileNode.type as string) === 'TemplateElement' &&
      regExpTest(
        anyStringWildcardRegExp,
        (queryNode.value as any).raw as string
      )
    ) {
      const regex = patternToRegex(
        (queryNode.value as any).raw as string,
        caseInsensitive
      )
      const levelMatch = regExpTest(
        regex,
        (fileNode.value as any).raw as string
      )
      measureCompare()
      return {
        levelMatch: levelMatch,
        queryKeysToTraverse: [],
        fileKeysToTraverse
      }
    }

    if (
      (queryNode.type as string) === 'NumericLiteral' &&
      (fileNode.type as string) === 'NumericLiteral' &&
      ((queryNode.extra as any).raw as string) === numericWildcard
    ) {
      measureCompare()
      return {
        levelMatch: true,
        queryKeysToTraverse: [],
        fileKeysToTraverse
      }
    }

    if (
      queryKeys.length !== fileKeys.length ||
      fileNode.type !== queryNode.type
    ) {
      measureCompare()
      return {
        levelMatch: false,
        queryKeysToTraverse: [],
        fileKeysToTraverse
      }
    }

    let primitivePropsCount = 0
    let matchingPrimitivePropsCount = 0

    queryKeys.forEach((key) => {
      const queryValue = queryNode[key]
      const fileValue = fileNode[key]
      if (
        isNode(queryValue as PoorNodeType) ||
        isNodeArray(queryValue as PoorNodeType[]) ||
        isNodeArray(fileValue as PoorNodeType[])
      ) {
        queryKeysToTraverse.push(key)
      } else {
        primitivePropsCount++
        if (
          typeof queryValue === 'string' &&
          typeof fileValue === 'string' &&
          caseInsensitive
        ) {
          if (
            queryValue.toLocaleLowerCase() === fileValue.toLocaleLowerCase()
          ) {
            matchingPrimitivePropsCount++
          }
        } else if (
          queryValue === fileValue ||
          JSON.stringify(queryValue as any) === JSON.stringify(fileValue as any)
        ) {
          matchingPrimitivePropsCount++
        }
      }
    })

    log('compare: queryKeysToTraverse', queryKeysToTraverse)
    log('compare: fileKeysToTraverse', fileKeysToTraverse)
    logStepEnd('compare')
    measureCompare()
    return {
      levelMatch:
        primitivePropsCount !== 0 &&
        primitivePropsCount === matchingPrimitivePropsCount &&
        queryKeys.every((key) => fileKeys.includes(key)),
      queryKeysToTraverse,
      fileKeysToTraverse
    }
  }

  const validateMatch = (
    currentNode: PoorNodeType,
    currentQueryNode: PoorNodeType
  ) => {
    logStepStart('validate')

    const { levelMatch, queryKeysToTraverse } = compareNodes(
      currentNode,
      currentQueryNode
    )
    if (!levelMatch) {
      try {
        log(
          'nodes incompat:\n\n',
          generate(currentNode as any).code,
          '\n\n',
          generate(currentQueryNode as any).code,
          '\n'.padEnd(10, '_')
        )
      } catch (e) {
        log('nodes incompat:\n\n', 'invalid code')
      }
      return false
    } else {
      if (queryKeysToTraverse.length > 0) {
        for (const keyToTraverse of queryKeysToTraverse) {
          log('validate: keyToTraverse', keyToTraverse)
          log('validate: file val', currentNode[keyToTraverse])
          log('validate: query val', currentQueryNode[keyToTraverse])

          if (Array.isArray(currentNode[keyToTraverse] as PoorNodeType[])) {
            log('validate: is array')
            const nodesArr = (
              currentNode[keyToTraverse] as PoorNodeType[]
            ).filter(shouldCompareNode)
            const queryNodesArr = (
              currentQueryNode[keyToTraverse] as PoorNodeType[]
            ).filter(shouldCompareNode)

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
                  !validateMatch(newCurrentNode, newCurrentQueryNode)
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
                sortByLeastIdentifierStrength
              )

              for (let i = 0; i < queryNodesArrSorted.length; i++) {
                const queryNode = queryNodesArrSorted[i]

                for (let j = 0; j < nodesArr.length; j++) {
                  const newCurrentNode = nodesArr[j]
                  if (!matchedIndexes.includes(j)) {
                    if (validateMatch(newCurrentNode, queryNode)) {
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
                  }
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

            const newCurrentNode = currentNode[keyToTraverse] as PoorNodeType
            const newCurrentQueryNode = currentQueryNode[
              keyToTraverse
            ] as PoorNodeType
            log('validate: newCurrentNode', newCurrentNode)
            log('validate: newCurrentQueryNode', newCurrentQueryNode)

            if (
              !newCurrentNode ||
              !newCurrentQueryNode ||
              !validateMatch(newCurrentNode, newCurrentQueryNode)
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

  const traverseAndMatch = (
    currentNode: PoorNodeType,
    queryNode: PoorNodeType
  ) => {
    logStepStart('traverse')
    const matches = []

    /**
     * LOOK FOR MATCH START
     */
    const { levelMatch, fileKeysToTraverse } = compareNodes(
      currentNode,
      queryNode
    )

    const foundMatchStart = levelMatch

    /**
     * PROCESS CURRENT MATCH
     */

    if (foundMatchStart) {
      const query = generate(queryNode as any).code
      const code = generate(currentNode as any, {
        jsescOption: { compact: false },
        retainFunctionParens: true
      }).code
      log(
        'foundMatchStart:\n',
        code,
        '\n',
        generate(queryNode as any).code,
        '\n'.padEnd(10, '_')
      )
      const measureValidate = measureStart('validate')
      const match = validateMatch(currentNode, queryNode)
      measureValidate()
      if (match) {
        matches.push({
          start: currentNode.start as number,
          end: currentNode.end as number,
          loc: currentNode.loc as Match['loc'],
          query: query.toString()
        })
      }
    }

    /**
     * TRAVERSE TO FIND NEW MATCHES START
     */

    const nestedMatches = fileKeysToTraverse
      .map((key) => {
        if (currentNode[key] !== undefined) {
          if (isNode(currentNode[key] as PoorNodeType)) {
            return traverseAndMatch(currentNode[key] as PoorNodeType, queryNode)
          } else {
            return (currentNode[key] as PoorNodeType[]).map((node) =>
              traverseAndMatch(node, queryNode)
            )
          }
        }
        return []
      })
      .flat(2) as Match[]

    logStepEnd('traverse')

    return [...matches, ...nestedMatches].flat()
  }

  for (const filePath of filePaths) {
    try {
      log('Parse file')
      const measureReadFile = measureStart('readFile')

      const fileContent = fs.readFileSync(filePath).toString()
      measureReadFile()

      const measureShallowSearch = measureStart('shallowSearch')

      const fileContentForTokensLookup = caseInsensitive
        ? fileContent.toLocaleLowerCase()
        : fileContent

      const includesUniqueTokens = queries.some(({ uniqueTokens }) =>
        uniqueTokens.every((token) =>
          fileContentForTokensLookup.includes(token)
        )
      )
      measureShallowSearch()

      const uniqueTokens = queries.reduce(
        (tokens, { uniqueTokens }) => [...tokens, ...uniqueTokens],
        [] as string[]
      )
      log('Unique tokens', uniqueTokens)
      log(
        `Include unique tokes (${uniqueTokens.length}) ${includesUniqueTokens}`
      )

      if (includesUniqueTokens) {
        const measureParseFile = measureStart('parseFile')

        const maybeWrappedJSON = /\.json$/.test(filePath)
          ? `(${fileContent})`
          : fileContent
        const fileNode = parse(
          maybeWrappedJSON,
          parseOptions
        ) as unknown as PoorNodeType

        measureParseFile()
        const programBody = getBody(fileNode)
        const measureSearch = measureStart('search')

        programBody.forEach((bodyPart) => {
          for (const { queryNode } of queries) {
            const matches = traverseAndMatch(bodyPart, queryNode)
            allMatches.push(
              ...matches.map((match) => {
                const code = prepareCodeResult({ fileContent, ...match })
                const [extendedCodeFrame, newStartLine] = getExtendedCodeFrame(
                  match,
                  fileContent
                )
                return {
                  filePath,
                  ...match,
                  code,
                  extendedCodeFrame: {
                    code: extendedCodeFrame,
                    startLine: match.loc.start.line + newStartLine
                  }
                }
              })
            )

            if (matches.length > 0) {
              log(filePath, 'matches', matches)
            }
          }
        })

        measureSearch()

        if (debug) {
          break
        }
      }
    } catch (e) {
      searchErrors.push(e)
      if (debug) {
        console.error(filePath, e)
        break
      }
    }
  }
  return {
    matches: dedupMatches(allMatches, log, debug),
    errors: searchErrors
  }
}
