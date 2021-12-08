/**
 * BUG: (<$
    data-testid={'linkedinUrl'}
  >
  </$>) return s nothing, probably after previous refactor...
 * 
 * Refactor + Implement tests!!!
 * 
 * Add literal wildcards
 *  - string literal cannot be replaced with identifier in some scenarios eg import
 *  - we should be able to always use identifier wildcard in place of number
 *  - we still need number wildcard for some cases
 * 
 * improve query parsing
 *  - first try to parse without brackets, then add brackets and parse once again
 * 
 * Add support for regexp identifier matches (on$ -> onClick, onHover etc)
 * 
 * Add support for nested gitignore
 * 
 * Feature import-based search
 *  - search in file and all files imported by a file
 *  - eg. your test failed
 *    - you search for test based on name
 *    - you specify a query to find failing code patterns in files imported by test
 * 
 * Do benchmark (done)
 *  - mac 1.4s
 *  - desktop 2.6s 
 *  - laptop 4.5s
 * 
 * Do profiling
 *  - maybe we can optimize by identifiers search
 *    - probably there is amount of identifiers that we can search to gain time,but if we search for too many, we will lose time
 *    - just one identifier is a good starting point
 * 
 * Think of negation syntax and sense (just to make if future proof for now)
 *  - could be something like: $not('asd')
 * Think of and, or syntax and sense (just to make if future proof for now)
 *  - could be something like: $and('asd', () => {}) 
 * Think of support for ref matching
 *  - user should be able to indicate that two wildcards are the same identifier 
 *  - eg. const $_ref1 = 'string'; call($_ref1)
 * 
 * Think of other use cases for the matching functionality (call the whole product code-magic)
 *  - should the product be an licensed cli ?
 *  - vscode search extension
 *      - other editors extensions (how to, which languages)
 *  - cli search - why not
 *  - standalone desktop app
 *  - eslint plugin restricted syntax 
 *    - check in autozone if custom plugins could be replaced
 *    - check which of the existing plugins could be replaced
 *    - plugin should have reference analisys (user should be able to mark that two identifiers should be the same, eg using $_ref1)
 *  - automated codemod - this one needs a PoC
 *    - check some codemods
 *    - program should be able to get diff of AST
 *    - 3 steps
 *       - implement query
 *       - implement transformed query
 *       -> generate AST diff and use it as a transform (try use json-diff with removed misc keys)
 *       - show example result
 *  - for codemod and eslint we need to be able to reference a variable by indentifier, to be able to track references for more complex cases
 *  - track duplicated code - how (eg. pattern to match all DB queries, then exact compare of AST)
 *  - metrics: project has 1000 DB queries, project has 3000 react components
 *  - check what SonarQube can measure
 *  - tool like rev-dep could be part of code-magic toolset
 *    - think how it could improve refactoring
 *  - Feature: get all values of given property
 *    - eg. to assert unique test-ids across all files
 *  - Feature import-based search
 *    - search in file and all files imported by a file
 *    - eg. your test failed
 *     - you search for test based on name
 *      - you specify a query to find failing code patterns in files imported by test
 * 
 * Add support for suggestions based on equivalent/similar syntax
 *  - user input: <$ prop={"5"} />,  suggestion: <$ prop="5" />
 *  - user input: <$ prop={$+$} />,  suggestion: <$ prop={$-$} />
 * Add hints based on first node
 *  - user input: {a:b}, hint: You probably needs ({a:b}), right now it is a block statement
 * 
 * To secure the code we should 
 *  - verify license in WASM
 *  - implement parts of the algorithm in WASM
 *  - implemented parts do not work if license is not verified
 */

import path from 'path'
import fs from 'fs';
import { parse, ParserOptions } from '@babel/parser'
import generate from '@babel/generator'
import ignore from 'ignore';

const root = path.resolve('../../Dweet/web')
let debugMode = false;
type Mode = 'exact' | 'include' | 'include-with-order'

// const mode: Mode = 'exact'
const mode: Mode = 'include'


const queries = [
  `
  (<$
    data-testid={'linkedinUrl'}
  >
  </$>)
`,
  `
  (<$
    data-testid={'linkedinUrl'}
  />)
  
`
]

const mockFile = fs.readFileSync('./mockFile').toString()

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
  let gitignore = ''
  try {
    gitignore = fs.readFileSync(path.join(root, '.gitignore')).toString()
  }
  catch (e) {
    console.log('gitignore not found')
  }
  const ignoreInstance = ignore().add(gitignore)
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

type Position = {
  line: number, column: number
}

type Match = {
  start: Position,
  end: Position,
  code: string
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
  const allMatches: Array<Match & { filePath: string }> = []
  const isExact = mode === ('exact' as Mode)
  /**
   * Assumption - query has only one top-level expression
   */
  const parseOptions = { sourceType: 'module', plugins: ['typescript', 'jsx', 'decorators-legacy'] } as ParserOptions

  const queriesWrapped = queries.join('\n\n')//queries.map((q) => `(${q.trim()});`).join('\n\n')

  log('Parse query')
  const queryFileNode = parse(queriesWrapped, parseOptions) as unknown as PoorNodeType
  const inputQueryNodes = getBody(queryFileNode).map(unwrapExpressionStatement)
  log('inputQueryNode', inputQueryNodes)

  const astPropsToSkip = ['loc', 'start', 'end', 'extra', 'trailingComments', 'leadingComments']
  const IdentifierTypes = ['Identifier', 'JSXIdentifier']

  const NodeConstructor = parse('').constructor

  const isNode = (maybeNode: PoorNodeType) => {
    return maybeNode?.constructor === NodeConstructor
  }

  const isNodeArray = (maybeNodeArr: PoorNodeType[]) => {
    return Array.isArray(maybeNodeArr) && maybeNodeArr.length > 0 && isNode(maybeNodeArr[0])
  }

  console.log("queries:", queriesWrapped)

  const getKeysToCompare = (node: PoorNodeType) => {
    return Object.keys(node).filter((key) => !astPropsToSkip.includes(key))
  }

  const sanitizeJSXText = (node: PoorNodeType) => {
    //@ts-ignore
    node.value = node.value?.trim()
    //@ts-ignore
    node.extra.raw = node.extra.raw?.trim()
    //@ts-ignore
    node.extra.rawValue = node.extra.rawValue?.trim()
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
          arrayAttributes.add(`${currentNode.type}-${key}`)
          return (currentNode[key] as PoorNodeType[]).map((node) =>
            traverseAndMatch(node, queryNode))
        }
      }
      return []
    }).flat(2) as Match[]

    logStepEnd('traverse')

    return [...matches, ...nestedMatches].flat()

  }

  for (const filePath of filesList) {
    try {
      log('Parse file')
      const fileContent = fs.readFileSync(filePath).toString()
      const fileNode = (!debugMode ? parse(fileContent, parseOptions)
        : parse(mockFile, parseOptions)) as unknown as PoorNodeType

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
      if (debugMode) {
        break;
      }
    }
    catch (e) {
      console.error(filePath, e)
      if (debugMode) {
        break;
      }
    }
  }
  console.log(allMatches)
  console.log('Matches count', allMatches.length)
  // console.log(arrayAttributes)
}
search()

