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

export type FileSystemSearchArgs = {
  filePaths: string[]
  queryCodes: string[]
  mode: Mode
  caseInsensitive?: boolean
  debug?: boolean
}

export type SearchResults = {
  matches: Matches
  errors: Array<any>
}
