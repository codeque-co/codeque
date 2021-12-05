import path from 'path'
import fs from 'fs';
import { parse, ParserOptions } from '@babel/parser'
import generate from '@babel/generator'
import ignore from 'ignore';

const root = path.resolve('../../Dweet/web')
const debugMode = false;
type Mode = 'exact' | 'include' | 'include-with-order'

// const mode:Mode = 'exact' 
const mode: Mode = 'exact'

/**
 * TODO: handle TemplateElement.value which is an object. It should work, but the below example finds too much in include mode, but works in exact mode
 */
const _query = `
({
  prId: number,
  message: \`
Pipeline ("\${name}")[\${getPipeline({
    workflowId,
    pipelineId,
  })}] was cancelled\`,
})
`

const mockFile = `


export class ModifiedValues extends RecommendationReference {
  recommenderJobTitle?: string;

  constructor({ recommenderJobTitle, ...props }: ModifiedValues) {
    super(props);

    this.recommenderJobTitle = recommenderJobTitle;
  }
}

export class RecommendationEmails {
  hasSentThankYou?: boolean;
  hasSentReminder?: boolean;

  constructor(props: RecommendationEmails) {
    Object.entries(props).map(([k, v]) => {
      this[k] = v;
    });
  }
}

export class Recommendation extends RecommendationReference {
  id?: string;
  recommender: Recommender;
  hasDiscrepancy?: boolean;
  comments?: string;
  createdAt?: Date;
  isCurrentJob?: boolean;
  messageToRecommender?: string;
  modifiedValues?: ModifiedValues;
  reHire?: 'Yes' | 'No' | 'Other';
  response?: RecomResponse;
  stage?: RecommendationStage;
  status: RecommendationStatus;
  testimonial?: Testimonial;
  updatedAt?: Date;
  lastUpdatedStatus?: Date;
  isHidden?: boolean;
  hasTrackedCompleted?: boolean;
  emails?: RecommendationEmails;
  workHistoryId?: string;

  constructor(props: Partial<Recommendation>) {
    const {
      id,
      response,
      hasDiscrepancy,
      comments,
      createdAt,
      isCurrentJob,
      messageToRecommender,
      modifiedValues,
      reHire,
      recommender,
      status,
      stage,
      testimonial,
      updatedAt,
      lastUpdatedStatus,
      isHidden,
      hasTrackedCompleted,
      emails,
      workHistoryId,
    } = props;

    super(props);

    this.id = id;
    this.workHistoryId = workHistoryId;
    this.hasDiscrepancy = hasDiscrepancy;
    this.comments = comments;
    this.createdAt = createdAt;
    this.isCurrentJob = isCurrentJob;
    this.messageToRecommender = messageToRecommender;
    this.modifiedValues = modifiedValues;
    this.reHire = reHire;
    this.status = status;
    this.stage = stage;
    this.updatedAt = updatedAt;
    this.lastUpdatedStatus = lastUpdatedStatus;
    this.isHidden = isHidden;
    this.hasTrackedCompleted = hasTrackedCompleted;

    if (testimonial) {
      this.testimonial = new Testimonial(testimonial);
    }

    if (response) {
      this.response = new RecomResponse(response);
    }

    if (modifiedValues) {
      this.modifiedValues = new ModifiedValues(modifiedValues);
    }

    if (recommender) {
      this.recommender = new Recommender(recommender);
    }

    if (emails) {
      this.emails = emails;
    }
  }
}

export interface GetRecommendationResponse {
  consultant: {
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  recommendation: Recommendation;
}

export interface PublicRecommendation
  extends Pick<
    Recommendation,
    | 'id'
    | 'workHistoryId'
    | 'company'
    | 'jobTitle'
    | 'relationship'
    | 'createdAt'
  > {
  recommenderJobTitle?: string;
  recommendation?: string;
  name?: string;
}


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
  log('Parse query')
  const queryFileNode = parse(_query, parseOptions) as unknown as PoorNodeType
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

    if (IdentifierTypes.includes(queryNode.type as string) && queryNode.name === '$') {
      return {
        levelMatch: true,
        queryKeysToTraverse: queryNode.typeAnnotation !== undefined ? ['typeAnnotation'] : [],
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
      break;
    }
  }
  console.log(allMatches)
  console.log('Matches count', allMatches.length)
  // console.log(arrayAttributes)
}
search()

