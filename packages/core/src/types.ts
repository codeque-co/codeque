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
  code: string
  query: string
}
export type ExtendedCodeFrame = {
  code: string
  startLine: number
}

export type MatchWithFileInfo = Match & {
  filePath: string
  extendedCodeFrame?: ExtendedCodeFrame
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
}

export type ParseError = {
  text: string
  location?: Position
  code?: string
  reasonCode?: string
}

export type ParsedQuery = {
  queryNode: PoorNodeType
  queryCode: string
  uniqueTokens: string[]
  hints: Hint[]
  error: ParseError | null
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
