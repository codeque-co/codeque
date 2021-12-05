import path from 'path'
import fs from 'fs';
import { parse, ParserOptions } from '@babel/parser'
import generate from '@babel/generator'
import ignore from 'ignore';

const root = path.resolve('../../Dweet/web')
const debugMode = false;
type Mode = 'exact' | 'include' | 'include-with-order'

// const mode:Mode = 'exact' 
const mode: Mode = 'include'

const _query = `
interface $ {
  userId: string;
}
`

const mockFile = `
<Field
                  variant="filled"
                  label="Tell us why you recommend them to us?"
                  component={FinalFormTextarea}
                  name={getFieldName('reason')}
                  wrapperProps={{
                    w: '100%',
                  }}
                  data-testid="refer-professional-reason-input"
                />

`

const log = (...args: any[]) => {
  if (debugMode) {
    console.log(...args)
  }
}

const logStepStart = (stepName: string) => {
  log('\n' + stepName, '\n'.padStart(10, '^'))
}

const logStepEnd = (stepName: string) => {
  log('\n' + stepName, '\n'.padStart(10, '&'))
}

const getFilesList2 = (root: string) => {
  const ignoreInstance = ignore().add(fs.readFileSync(path.join(root, '.gitignore')).toString())
  const scan = (dir: string): string[] => {
    const entriesList = fs.readdirSync(dir, {
      // withFileTypes: true // This should work but throws an error, so we have to workaround
    }) as string[]
    const relativeToCWD = entriesList.map((entryName) => path.relative(root, path.join(dir, entryName)))
    const filtered = ignoreInstance.filter(relativeToCWD)
    const absolutePaths = filtered.map((pathName) => path.join(root, pathName))
    const directories = absolutePaths.filter((pathName) => fs.lstatSync(pathName).isDirectory())
    const files = absolutePaths.filter((pathName) => fs.lstatSync(pathName).isFile())

    const extensionTester = /\.(js|jsx|ts|tsx)$/

    return [
      ...files.filter((pathName) => extensionTester.test(pathName)),
      ...directories.map(scan).flat()
    ]
  }

  const filesList = scan(root)
  return filesList
}

const filesList = getFilesList2(root)

type Location = {
  start: number, end: number
}
type PoorNodeType = {
  [key: string]: string | number | PoorNodeType[] | PoorNodeType
}

const getBody = (fileNode: PoorNodeType) => {
  return (fileNode.program as PoorNodeType).body as PoorNodeType[]
}

const unwrapExpressionStatement = (node: PoorNodeType) => {
  if (node.type === 'ExpressionStatement') {
    return node.expression as PoorNodeType
  }
  return node as PoorNodeType
}

const arrayAttributes = new Set()

const search = () => {
  const isExact = mode === ('exact' as Mode)
  /**
   * Assumption - query has only one top-level expression
   */
  const parseOptions = { sourceType: 'module', plugins: ['typescript', 'jsx', 'decorators-legacy'] } as ParserOptions
  log('Parse query')
  const queryFileNode = parse(_query, parseOptions) as unknown as PoorNodeType
  const inputQueryNode = unwrapExpressionStatement(getBody(queryFileNode)[0])
  log('inputQueryNode', inputQueryNode)

  const astPropsToSkip = ['loc', 'start', 'end', 'extra']
  const IdentifierTypes = ['Identifier', 'JSXIdentifier']

  const NodeConstructor = parse('').constructor

  const isNode = (maybeNode: PoorNodeType) => {
    return maybeNode?.constructor === NodeConstructor
  }

  const isNodeArray = (maybeNodeArr: PoorNodeType[]) => {
    return Array.isArray(maybeNodeArr) && maybeNodeArr.length > 0 && isNode(maybeNodeArr[0])
  }

  console.log("query:", _query)

  const getKeysToCompare = (node: PoorNodeType) => {
    return Object.keys(node).filter((key) => !astPropsToSkip.includes(key))
  }

  const compareNodes = (fileNode: PoorNodeType, queryNode: PoorNodeType) => {
    logStepStart('compare')

    const queryKeys = getKeysToCompare(queryNode)
    const fileKeys = getKeysToCompare(fileNode)

    log('compare: node type', fileNode.type)

    log('compare:  queryKeys', queryKeys)
    log('compare: fileKeys', fileKeys)

    const queryKeysToTraverse: string[] = []
    const fileKeysToTraverse: string[] = []

    fileKeys.forEach((key) => {
      const fileValue = fileNode[key]
      if (isNode(fileValue as PoorNodeType) || isNodeArray(fileValue as PoorNodeType[])) {
        fileKeysToTraverse.push(key)
      }

    })

    if (queryKeys.length !== fileKeys.length || fileNode.type !== queryNode.type) {
      return {
        levelMatch: false,
        queryKeysToTraverse: [],
        fileKeysToTraverse
      }
    }

    if (IdentifierTypes.includes(queryNode.type as string) && queryNode.name === '$') {
      return {
        levelMatch: true,
        queryKeysToTraverse: queryNode.typeAnnotation !== undefined ? ['typeAnnotation'] : [],
        fileKeysToTraverse
      }
    }

    let primitivePropsCount = 0
    let matchingPrimitivePropsCount = 0

    queryKeys.forEach((key) => {
      const queryValue = queryNode[key]
      const fileValue = fileNode[key]
      if (isNode(queryValue as PoorNodeType) || isNodeArray(queryValue as PoorNodeType[])) {
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

                if (newCurrentNode === undefined || newCurrentQueryNode === undefined || !validateMatch(newCurrentNode, newCurrentQueryNode)) {
                  return false
                }
              }
            }
            else {
              if (queryFileNode.length > nodesArr.length) {
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
                return propsFoundInOrder && matchedIndexes.length === queryNodesArr.length
              }
              else {
                return matchedIndexes.length === queryNodesArr.length
              }
            }
          }
          else {
            log('validate: is Node')

            const newCurrentNode = currentNode[keyToTraverse] as PoorNodeType
            const newCurrentQueryNode = currentQueryNode[keyToTraverse] as PoorNodeType

            if (newCurrentNode === undefined || newCurrentQueryNode === undefined || !validateMatch(newCurrentNode, newCurrentQueryNode)) {
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
      log('foundMatchStart:\n', generate(currentNode as any).code, '\n', generate(queryNode as any).code, '\n'.padEnd(10, '_'))
      const match = validateMatch(currentNode, queryNode)
      if (match) {
        matches.push(
          currentNode.loc as unknown as Location
        )
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
          arrayAttributes.add(`${currentNode.type}-${key}`)
          return (currentNode[key] as PoorNodeType[]).map((node) =>
            traverseAndMatch(node, queryNode))
        }
      }
      return []
    }).flat(2) as Location[]

    logStepEnd('traverse')

    return [...matches, ...nestedMatches].flat()

  }
  let matchesCount = 0;
  for (const filePath of filesList) {
    try {
      log('Parse file')

      const fileNode = (!debugMode ? parse(fs.readFileSync(filePath).toString(), parseOptions)
        : parse(mockFile, parseOptions)) as unknown as PoorNodeType

      const programBody = getBody(fileNode)

      programBody.forEach((bodyPart) => {
        const matches = traverseAndMatch(bodyPart, inputQueryNode)
        matchesCount += matches.length

        if (matches.length > 0) {
          log(filePath, 'matches', matches)
        }
      })
      if (debugMode) {
        break;
      }
    }
    catch (e) {
      console.error(filePath, e)
      break;
    }
  }
  console.log('Matches count', matchesCount)
  // console.log(arrayAttributes)
}
search()

