import fs from 'fs';
import { parse } from '@babel/parser'
import generate from '@babel/generator'
import { createLogger, Mode, measureStart, patternToRegex } from './utils';

import {
  getBody,
  unwrapExpressionStatement,
  getKeysToCompare,
  sanitizeJSXText,
  isNode,
  isNodeArray,
  IdentifierTypes,
  Match,
  PoorNodeType,
  Position,
  parseOptions
} from './astUtils'


type SearchArgs = {
  filePaths: string[],
  queries: string[],
  mode: Mode,
  debug?: boolean
}

type Matches = Array<Match & { filePath: string }>

const dedupMatches = (matches: Matches, log: (...args: any[]) => void, debug = false) => {
  const deduped: Matches = []

  matches.forEach((match) => {
    const alreadyIn = deduped.some((_match) => {
      return match.filePath === _match.filePath
        && match.start.column === _match.start.column
        && match.start.line === _match.start.line
        && match.end.column === _match.end.column
        && match.end.line === _match.end.line
    })

    if (!alreadyIn) {
      deduped.push(match)
    }
    else if (debug) {
      log('already in', match.code, match.query)
    }
  })

  return deduped
}

export const search = ({ mode, filePaths, queries, debug = false }: SearchArgs) => {
  const { log, logStepEnd, logStepStart } = createLogger(debug)
  const allMatches: Matches = []
  const isExact = mode === ('exact' as Mode)
  log('Parse query')
  const measureParseQuery = measureStart('parseQuery')

  const inputQueryNodes = queries.map((queryText) => {
    try {
      return parse(queryText, parseOptions) as unknown as PoorNodeType
    }
    catch (e) {
      return parse(`(${queryText})`, parseOptions) as unknown as PoorNodeType
    }
  })
    .map(getBody)
    .map((bodyArr) => bodyArr[0])
    .map(unwrapExpressionStatement)
    .filter(Boolean)

  measureParseQuery()
  log('inputQueryNode', inputQueryNodes)

  const numericWildcard = '0x0'
  const wildcard = '$'
  const stringWildcard = wildcard
  const singleIdentifierWildcard = wildcard
  const doubleIdentifierWildcard = `${wildcard}${wildcard}`

  const getUniqueTokens = (queryNode: PoorNodeType, tokens: Set<string> = new Set()) => {
    if (IdentifierTypes.includes(queryNode.type as string)) {
      tokens.add(queryNode.name as string)
    }

    if ((queryNode.type as string) === 'StringLiteral' && !(queryNode.value as string).includes(stringWildcard)) {
      tokens.add(queryNode.value as string)
    }

    if ((queryNode.type as string) === 'NumericLiteral') {
      const raw = (queryNode.extra as any).raw as string
      if (raw !== numericWildcard) {
        tokens.add(raw)
      }
    }

    const nodeKeys = getKeysToCompare(queryNode).filter((key) =>
      isNode(queryNode[key] as PoorNodeType) || isNodeArray(queryNode[key] as PoorNodeType[])
    )

    nodeKeys.forEach((key) => {
      const nodeVal = queryNode[key]
      if (isNodeArray(nodeVal as PoorNodeType[])) {
        (nodeVal as PoorNodeType[]).forEach((node) => getUniqueTokens(node, tokens))
      }
      else {
        getUniqueTokens(nodeVal as PoorNodeType, tokens)
      }
    })
    return tokens
  }

  const compareNodes = (fileNode: PoorNodeType, queryNode: PoorNodeType) => {
    const measureCompare = measureStart('compare')
    logStepStart('compare')

    const queryKeys = getKeysToCompare(queryNode)
    const fileKeys = getKeysToCompare(fileNode)

    log('compare: node type', fileNode.type)

    log('compare:  queryKeys', queryKeys)
    log('compare: fileKeys', fileKeys)

    const queryKeysToTraverse: string[] = []
    const fileKeysToTraverse: string[] = []

    if (fileNode.type === 'JSXText') {
      sanitizeJSXText(fileNode)
    }

    if (queryNode.type === 'JSXText') {
      sanitizeJSXText(queryNode)
    }

    fileKeys.forEach((key) => {
      const fileValue = fileNode[key]
      if (isNode(fileValue as PoorNodeType) || isNodeArray(fileValue as PoorNodeType[])) {
        fileKeysToTraverse.push(key)
      }

    })

    if (
      (fileNode.type as string).includes('TS')
      && (fileNode.type as string).includes('Keyword')
      && (queryNode.type as string) === 'TSTypeReference'
      && ((queryNode.typeName as any).name as string) === singleIdentifierWildcard
      && ((queryNode.typeParameters as any)) === undefined

    ) {
      return {
        levelMatch: true,
        queryKeysToTraverse: [],
        fileKeysToTraverse
      }
    }

    if (IdentifierTypes.includes(queryNode.type as string) && (queryNode.name as string).includes(singleIdentifierWildcard)) {
      let levelMatch;

      if (queryNode.name === doubleIdentifierWildcard) {
        levelMatch = true
      } else {
        const regex = patternToRegex(queryNode.name as string);
        levelMatch = fileNode.type === queryNode.type && regex.test(fileNode.name as string)

        if (isExact) {
          levelMatch = levelMatch && typeof queryNode.typeAnnotation === typeof fileNode.typeAnnotation
        }
      }

      measureCompare()
      return {
        levelMatch,
        queryKeysToTraverse: queryNode.name !== doubleIdentifierWildcard && queryNode.typeAnnotation !== undefined ? ['typeAnnotation'] : [],
        fileKeysToTraverse
      }
    }

    if ((queryNode.type as string) === 'ImportDefaultSpecifier' && (queryNode.local as PoorNodeType).name === doubleIdentifierWildcard) {
      // treat "import $$ from '...'" as wildcard for any import
      measureCompare()
      return {
        levelMatch: true,
        queryKeysToTraverse: [],
        fileKeysToTraverse
      }
    }

    if ((queryNode.type as string) === 'TSTypeReference' && (queryNode.typeName as PoorNodeType).name === doubleIdentifierWildcard) {
      // treat "const a: $$; const a: () => $$" $$ as wildcard for any type annotation
      measureCompare()
      return {
        levelMatch: true,
        queryKeysToTraverse: [],
        fileKeysToTraverse
      }
    }

    if ((queryNode.type as string) === 'StringLiteral' && (fileNode.type as string) === 'StringLiteral' && (queryNode.value as string).includes(stringWildcard)) {
      const regex = patternToRegex(queryNode.value as string)
      const levelMatch = regex.test(fileNode.value as string)
      measureCompare()
      return {
        levelMatch: levelMatch,
        queryKeysToTraverse: [],
        fileKeysToTraverse
      }
    }

    if ((queryNode.type as string) === 'NumericLiteral' && (fileNode.type as string) === 'NumericLiteral' && ((queryNode.extra as any).raw as string) === numericWildcard) {
      measureCompare()
      return {
        levelMatch: true,
        queryKeysToTraverse: [],
        fileKeysToTraverse
      }
    }

    if (queryKeys.length !== fileKeys.length || fileNode.type !== queryNode.type) {
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
      if (isNode(queryValue as PoorNodeType) || isNodeArray(queryValue as PoorNodeType[]) || isNodeArray(fileValue as PoorNodeType[])) {
        queryKeysToTraverse.push(key)
      }
      else {
        primitivePropsCount++
        if (queryValue === fileValue || JSON.stringify(queryValue as any) === JSON.stringify(fileValue as any)) {
          matchingPrimitivePropsCount++
        }
      }
    })

    log('compare: queryKeysToTraverse', queryKeysToTraverse)
    log('compare: fileKeysToTraverse', fileKeysToTraverse)
    logStepEnd('compare')
    measureCompare()
    return {
      levelMatch: primitivePropsCount !== 0 && primitivePropsCount === matchingPrimitivePropsCount && queryKeys.every((key) => fileKeys.includes(key)),
      queryKeysToTraverse,
      fileKeysToTraverse
    }
  }

  const validateMatch = (currentNode: PoorNodeType, currentQueryNode: PoorNodeType) => {
    logStepStart('validate')

    const { levelMatch, queryKeysToTraverse } = compareNodes(currentNode, currentQueryNode)
    if (!levelMatch) {
      log('nodes incompat:\n\n', generate(currentNode as any).code, '\n\n', generate(currentQueryNode as any).code, '\n'.padEnd(10, '_'))
      return false
    }
    else {
      if (queryKeysToTraverse.length > 0) {

        for (const keyToTraverse of queryKeysToTraverse) {
          log('validate: key', keyToTraverse)
          log('validate: file val', currentNode[keyToTraverse])
          log('validate: query val', currentQueryNode[keyToTraverse])
          if (isExact && Array.isArray(currentNode[keyToTraverse]) && Array.isArray(currentQueryNode[keyToTraverse]) && (currentNode[keyToTraverse] as []).length !== (currentQueryNode[keyToTraverse] as []).length) {
            return false
          }

          if (Array.isArray(currentNode[keyToTraverse] as PoorNodeType[])) {
            log('validate: is array')
            const nodesArr = currentNode[keyToTraverse] as PoorNodeType[]
            const queryNodesArr = currentQueryNode[keyToTraverse] as PoorNodeType[]
            if (isExact) {
              for (let i = 0; i < nodesArr.length; i++) {
                const newCurrentNode = nodesArr[i]
                const newCurrentQueryNode = queryNodesArr[i]

                if (!newCurrentNode || !newCurrentQueryNode || !validateMatch(newCurrentNode, newCurrentQueryNode)) {
                  return false
                }
              }
            }
            else {
              if (queryNodesArr.length > nodesArr.length) {
                return false
              }

              let matchedIndexes = []

              for (let i = 0; i < queryNodesArr.length; i++) {
                const queryNode = queryNodesArr[i]

                for (let j = 0; j < nodesArr.length; j++) {
                  const newCurrentNode = nodesArr[j]

                  if (validateMatch(newCurrentNode, queryNode)) {
                    matchedIndexes.push(j)
                    break;
                  }
                }

                if (matchedIndexes.length !== i + 1) {
                  return false
                }

              }

              if (mode === 'include-with-order' as Mode) {
                const propsFoundInOrder = matchedIndexes.every((val, idx, arr) => {
                  if (idx + 1 === arr.length) {
                    return true
                  }
                  else {
                    return val < arr[idx + 1]
                  }
                })
                if (!propsFoundInOrder || matchedIndexes.length !== queryNodesArr.length) {
                  return false
                }
              }
              else {
                if (matchedIndexes.length !== queryNodesArr.length) {
                  return false
                }
              }
            }
          }
          else {
            log('validate: is Node')

            const newCurrentNode = currentNode[keyToTraverse] as PoorNodeType
            const newCurrentQueryNode = currentQueryNode[keyToTraverse] as PoorNodeType

            if (!newCurrentNode || !newCurrentQueryNode || !validateMatch(newCurrentNode, newCurrentQueryNode)) {
              return false
            }

          }
        }
        return true
      }
      else {
        return true
      }
    }

  }

  const traverseAndMatch = (currentNode: PoorNodeType, queryNode: PoorNodeType) => {
    logStepStart('traverse')
    let matches = []

    /**
     * LOOK FOR MATCH START
     */
    const { levelMatch, fileKeysToTraverse } = compareNodes(currentNode, queryNode)

    const foundMatchStart = levelMatch

    /**
     * PROCESS CURRENT MATCH
     */

    if (foundMatchStart) {
      const query = generate(queryNode as any).code
      const code = generate(currentNode as any).code
      log('foundMatchStart:\n', code, '\n', generate(queryNode as any).code, '\n'.padEnd(10, '_'))
      const measureValidate = measureStart('validate')
      const match = validateMatch(currentNode, queryNode)
      measureValidate()
      if (match) {
        matches.push({
          start: (currentNode as any).loc.start as Position,
          end: (currentNode as any).loc.end as Position,
          code: code.toString(),
          query: query.toString()
        })
      }
    }

    /**
     * TRAVERSE TO FIND NEW MATCHES START
     */

    const nestedMatches = fileKeysToTraverse.map((key) => {
      if (currentNode[key] !== undefined) {
        if (isNode(currentNode[key] as PoorNodeType)) {
          return traverseAndMatch(currentNode[key] as PoorNodeType, queryNode)
        }
        else {
          return (currentNode[key] as PoorNodeType[]).map((node) =>
            traverseAndMatch(node, queryNode))
        }
      }
      return []
    }).flat(2) as Match[]

    logStepEnd('traverse')

    return [...matches, ...nestedMatches].flat()

  }
  const measureGetUniqueTokens = measureStart('getUniqueTokens')

  const uniqueTokens = [...inputQueryNodes.reduce((set: Set<string>, queryNode: PoorNodeType) => {
    const tokens = getUniqueTokens(queryNode)
    return new Set([...set, ...tokens])
  }, new Set())].filter((token) => typeof token !== 'string' || !token.includes('$'))


  measureGetUniqueTokens()

  for (const filePath of filePaths) {
    try {
      log('Parse file')
      const measureReadFile = measureStart('readFile')

      const fileContent = fs.readFileSync(filePath).toString()
      measureReadFile()

      const measureShallowSearch = measureStart('shallowSearch')

      const includesUniqueTokens = uniqueTokens.every((token) => fileContent.includes(token))
      measureShallowSearch()

      if (includesUniqueTokens) {

        const measureParseFile = measureStart('parseFile')

        const fileNode = (parse(fileContent, parseOptions)) as unknown as PoorNodeType
        measureParseFile()
        const programBody = getBody(fileNode)
        const measureSearch = measureStart('search')

        programBody.forEach((bodyPart) => {
          for (const inputQueryNode of inputQueryNodes) {
            const matches = traverseAndMatch(bodyPart, inputQueryNode)
            allMatches.push(...matches.map((match) => ({
              filePath,
              ...match
            })))

            if (matches.length > 0) {
              log(filePath, 'matches', matches)
            }
          }
        })

        measureSearch()

        if (debug) {
          break;
        }
      }
    }
    catch (e) {
      console.error(filePath, e)
      if (debug) {
        break;
      }
    }
  }

  return dedupMatches(allMatches, log, debug)
}

