import { Mode, NotNullParsedQuery, PoorNodeType } from '@codeque/core'

export type ParsedQueryWithSettings = {
  parsedQuery: NotNullParsedQuery
  mode: Mode
  caseInsensitive: boolean
  message: string
  excludeFiles: string[]
  includeFiles: string[] | undefined
}

export type RuleOption = {
  mode?: Mode
  query?: string
  message?: string
  caseInsensitive?: boolean
  includeFiles?: string[]
  excludeFiles?: string[]
}

export type SearchFn = (node: PoorNodeType) => void
export type VisitorsSearchMap = Record<string, SearchFn>
export type VisitorsSearchArrayMap = Record<string, Array<SearchFn>>
