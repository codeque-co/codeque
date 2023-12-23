import { Logger } from './logger'
import { MatchContext, MatchContextAliases } from './matchContext'
export type Mode = 'exact' | 'include' | 'include-with-order' | 'text'

export type Position = {
  line: number
  column: number
  index?: number
}

export type Location = {
  start: Position
  end: Position
}

export type MatchPosition = {
  start: number
  end: number
  loc: Location
}

export type Match = MatchPosition & {
  node: PoorNodeType
  aliases: MatchContextAliases
}

export type ExtendedCodeFrame = {
  code: string
  startLine: number
}

export type MatchWithFileInfo = Omit<Match, 'node'> & {
  query: string
  code: string
  filePath: string
  extendedCodeFrame: ExtendedCodeFrame
  indentationBase?: number
}

export type AstMatch = Omit<Match, 'node'> & {
  query: string
}

export type Matches = Array<MatchWithFileInfo>
export type AstMatches = Array<AstMatch>

export type PoorNodeTypeParentData = {
  node: PoorNodeType
  key: string
  index?: number
}

export type PoorNodeType = {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | PoorNodeType[]
    | PoorNodeType
} & {
  __parent?: PoorNodeTypeParentData
}

export type HardStopFlag = {
  stopSearch: boolean
  addStopListener: (listener: () => void) => void
  destroy: () => void
}

export type ParserType =
  | 'babel'
  | 'typescript-eslint-parser'
  | 'espree'
  | 'esprima'
  | 'babel-eslint-parser'
  | 'angular-eslint-template-parser'
  | 'css-tree'
  | 'python'
  | 'lua'

export type FileSystemSearchArgs = {
  filePaths: string[]
  queryCodes: string[]
  mode: Mode
  caseInsensitive?: boolean
  debug?: boolean
  onPartialResult?: (matches: Matches) => void
  maxResultsLimit?: number
  hardStopFlag?: HardStopFlag
  parser?: ParserType
  returnMatchedNodes?: boolean
  parserFilesBasePath?: string
}

export type ParseError = {
  text: string
  location?: Position
  code?: string
  reasonCode?: string
}

export type ParsedQuery = {
  queryNode: PoorNodeType | null
  queryCode: string
  uniqueTokens: string[]
  hints: Hint[]
  error: ParseError | null
  isMultistatement: boolean
}

export type NotNullParsedQuery = Omit<ParsedQuery, 'queryNode'> & {
  queryNode: PoorNodeType
}

export type SearchInFileError = { filePath: string; error: string }

export type SearchResults = {
  matches: Matches
  hints: Hint[][] // array of hints for each query
  errors: Array<SearchInFileError | ParsedQuery | string>
}

export type Hint = {
  text: string
  tokens: Array<{
    content: string
    type: 'text' | 'code'
  }>
}

export type WorkerOutboundMessage =
  | {
      type: 'ALL_RESULTS'
      data: SearchResults
    }
  | {
      type: 'PARTIAL_RESULT'
      data: Matches
    }

export type SearchWorkerData = FileSystemSearchArgs & {
  reportEachMatch: boolean
}

export type SearchSettings = {
  parserSettings: ParserSettings
  logger: Logger
  caseInsensitive: boolean
  mode: Mode
}

export type SearchSettingsWithOptionalLogger = Omit<
  SearchSettings,
  'logger'
> & {
  logger?: Logger
}

export type GetCodeForNode = {
  getCodeForNode?: (node: PoorNodeType, nodeType: 'query' | 'file') => string
}

export type WildcardMeta = {
  wildcardType: 'identifier' | 'nodeTree' | 'string'
  wildcardWithAlias: string
  wildcardWithoutAlias: string
  wildcardAlias: string | null
}

export type CompareNodesParams = {
  fileNode: PoorNodeType | null
  queryNode: PoorNodeType | null
  searchSettings: SearchSettings & GetCodeForNode
  matchContext: MatchContext
  /** Params used to support comparing nodes which are not on the same level */
  queryKeysPrefix?: string
  fileKeysPrefix?: string
}

export type CompareNodesReturnType = {
  levelMatch: boolean
  queryKeysToTraverseForValidatingMatch: string[]
  fileKeysToTraverseForValidatingMatch: string[]
  fileKeysToTraverseForOtherMatches: string[]
}

export type NodesComparator = (
  params: CompareNodesParams,
  topLevelCompareNodes: (params: CompareNodesParams) => CompareNodesReturnType,
  compareUtils: {
    queryKeysMapper: (key: string) => string
    fileKeysMapper: (key: string) => string
    fileKeysToTraverseForOtherMatches: string[]
    measureCompare: () => void
    log: (...text: string[]) => void
  },
) => CompareNodesReturnType | undefined

export type NodesComparatorParameters = Parameters<NodesComparator>

export type WildcardUtils = {
  optionalStringWildcardRegExp: RegExp
  requiredStringWildcardRegExp: RegExp
  anyStringWildcardRegExp: RegExp
  identifierWildcard: string
  nodesTreeWildcard: string
  numericWildcard: string
  disallowedWildcardSequence: string
  disallowedWildcardRegExp: RegExp
  removeWildcardAliasesFromIdentifierName: (identifier: string) => string
  removeWildcardAliasesFromStringLiteral: (str: string) => string
  getWildcardAliasFromWildcard: (name: string) => string | null
  getIdentifierWildcardsFromString: (name: string) => WildcardMeta[]
  getIdentifierWildcardsFromNode: (node: PoorNodeType) => WildcardMeta[]
  getStringWildcardsFromString: (content: string) => WildcardMeta[]
  patternToRegExp: (string: string, caseInsensitive: boolean) => RegExp
}

export type StringLikeLiteralUtils = {
  isStringLikeLiteralNode: (node: PoorNodeType) => boolean
  getStringLikeLiteralValue: (node: PoorNodeType) => string
}

export type NumericLiteralUtils = {
  isNumericLiteralNode: (node: PoorNodeType) => boolean
  getNumericLiteralValue: (node: PoorNodeType) => string
}

export type ProgramNodeAndBlockNodeUtils = {
  isProgramNode: (node: PoorNodeType) => boolean
  isBlockNode: (node: PoorNodeType) => boolean
  programNodeBodyKey: string
  blockNodeBodyKey: string
}

export type GetUniqueTokensFromStringOrIdentifierNode = (arg: {
  queryNode: PoorNodeType
  caseInsensitive: boolean
  parserSettings: Pick<
    ParserSettings,
    | 'isIdentifierNode'
    | 'stringLikeLiteralUtils'
    | 'getIdentifierNodeName'
    | 'wildcardUtils'
  >
}) => string[]

export type ParserSettings = {
  supportedExtensions: string[]
  parseCode: (code: string, filePath?: string) => PoorNodeType
  isNode: (maybeNode: PoorNodeType) => boolean
  identifierNodeTypes: string[]
  isIdentifierNode: (node: PoorNodeType) => boolean
  astPropsToSkip: (string | { type: string; key: string })[]
  getProgramBodyFromRootNode: (node: PoorNodeType) => PoorNodeType[]
  getProgramNodeFromRootNode: (node: PoorNodeType) => PoorNodeType
  getNodeType: (node: PoorNodeType) => string
  getIdentifierNodeName: (node: PoorNodeType) => string
  setIdentifierNodeName: (node: PoorNodeType, name: string) => void
  unwrapExpressionStatement: (node: PoorNodeType) => PoorNodeType
  createBlockStatementNode: (
    body: PoorNodeType[],
    position: MatchPosition,
  ) => PoorNodeType
  getSanitizedNodeValue: <T>(type: string, key: string, value: T) => T
  shouldCompareNode: (node: PoorNodeType) => void
  wildcardUtils: WildcardUtils
  compareNodesBeforeWildcardsComparison: NodesComparator
  compareNodesAfterWildcardsComparison: NodesComparator
  identifierTypeAnnotationFieldName?: string
  stringLikeLiteralUtils: StringLikeLiteralUtils
  numericLiteralUtils: NumericLiteralUtils
  programNodeAndBlockNodeUtils: ProgramNodeAndBlockNodeUtils
  getNodePosition: (node: PoorNodeType) => MatchPosition
  getParseErrorLocation: (error: Error) => { line: number; column: number }
  /**
   * Alternative node types used to match while in traversal mode
   * eg. wildcard Identifier matcher should look in JSXIdentifier visitor
   */
  alternativeNodeTypes: Record<string, string[]>
  preprocessQueryCode?: (code: string) => string
  postprocessQueryNode?: (queryNode: PoorNodeType) => PoorNodeType
  getUniqueTokensFromStringOrIdentifierNode?: GetUniqueTokensFromStringOrIdentifierNode
  init?: (basePath?: string) => Promise<void>
}

export type TreeSitterNodeFieldsMeta = Record<
  string,
  {
    type: string
    singleFieldNames: string[]
    nodeTypeToMultipleFieldName: Record<string, string>
    multipleOrChildrenFieldNames: string[]
  }
>

export type ValidateMatchReturnType = {
  match: boolean
}
