export type Mode = 'exact' | 'include' | 'include-with-order' | 'text'

export type Position = {
  line: number
  column: number
}

export type Match = {
  start: number
  end: number
  loc: {
    start: Position
    end: Position
  }
  node: PoorNodeType
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
}

export type Matches = Array<MatchWithFileInfo>

export type PoorNodeType = {
  [key: string]: string | number | boolean | PoorNodeType[] | PoorNodeType
}

export type HardStopFlag = {
  stopSearch: boolean
  addStopListener: (listener: () => void) => void
  destroy: () => void
}

export type FileSystemSearchArgs = {
  filePaths: string[]
  queryCodes: string[]
  mode: Mode
  caseInsensitive?: boolean
  debug?: boolean
  onPartialResult?: (matches: Matches) => void
  maxResultsLimit?: number
  hardStopFlag?: HardStopFlag
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

export type WildcardMeta = {
  wildcardType: 'identifier' | 'nodeTree'
  wildcardWithRef: string
  wildcardWithoutRef: string
  wildcardRef: string | null
}

export type WildcardUtils = {
  optionalStringWildcardRegExp: RegExp
  requiredStringWildcardRegExp: RegExp
  anyStringWildcardRegExp: RegExp
  identifierWildcard: string
  nodesTreeWildcard: string
  numericWildcard: string
  disallowedWildcardSequence: string
  disallowedWildcardRegExp: RegExp
  removeIdentifierRefFromWildcard: (identifier: string) => string
  getWildcardRefFromIdentifierName: (name: string) => string | null
  getWildcardFromString: (name: string) => WildcardMeta | null
  getWildcardFromNode: (node: PoorNodeType) => WildcardMeta | null
  patternToRegExp: (string: string, caseInsensitive: boolean) => RegExp
}

export type ParserSettings = {
  parseCode: (code: string, filePath?: string) => PoorNodeType
  isNode: (maybeNode: PoorNodeType) => boolean
  astPropsToSkip: string[]
  isNodeFieldOptional: (nodeType: string, nodeFieldKey: string) => boolean
  getProgramBodyFromRootNode: (fileNode: PoorNodeType) => PoorNodeType[]
  unwrapExpressionStatement: (node: PoorNodeType) => PoorNodeType
  createBlockStatementNode: (body: PoorNodeType[]) => PoorNodeType
  sanitizeNode: (node: PoorNodeType) => void
  shouldCompareNode: (node: PoorNodeType) => void
  wildcardUtils: WildcardUtils
}
