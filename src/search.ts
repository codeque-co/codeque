import fs from 'fs';
import { parse } from '@babel/parser'
import generate from '@babel/generator'
import { createLogger } from './utils';

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

export type Mode = 'exact' | 'include' | 'include-with-order'

type SearchArgs = {
  filePaths: string[],
  queries: string[],
  mode: Mode,
  debug?: boolean
}

export const search = ({ mode, filePaths, queries, debug = false }: SearchArgs) => {
  const { log, logStepEnd, logStepStart } = createLogger(debug)
  const allMatches: Array<Match & { filePath: string }> = []
  const isExact = mode === ('exact' as Mode)
  log('Parse query')

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

  log('inputQueryNode', inputQueryNodes)

  const compareNodes = (fileNode: PoorNodeType, queryNode: PoorNodeType) => {
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

    if (IdentifierTypes.includes(queryNode.type as string) && (queryNode.name as string).includes('$')) {
      return {
        levelMatch: queryNode.name === '$$' || fileNode.type === queryNode.type,
        queryKeysToTraverse: queryNode.name !== '$$' && queryNode.typeAnnotation !== undefined ? ['typeAnnotation'] : [],
        fileKeysToTraverse
      }
    }

    if (queryKeys.length !== fileKeys.length || fileNode.type !== queryNode.type) {
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
      const code = generate(currentNode as any).code
      log('foundMatchStart:\n', code, '\n', generate(queryNode as any).code, '\n'.padEnd(10, '_'))
      const match = validateMatch(currentNode, queryNode)
      if (match) {
        matches.push({
          start: (currentNode as any).loc.start as Position,
          end: (currentNode as any).loc.end as Position,
          code: code.toString()
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

  for (const filePath of filePaths) {
    try {
      log('Parse file')
      const fileContent = fs.readFileSync(filePath).toString()
      const fileNode = (parse(fileContent, parseOptions)) as unknown as PoorNodeType

      const programBody = getBody(fileNode)

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
      if (debug) {
        break;
      }
    }
    catch (e) {
      console.error(filePath, e)
      if (debug) {
        break;
      }
    }
  }

  return allMatches
}

