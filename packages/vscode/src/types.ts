import { SearchResults, MatchWithFileInfo } from '@codeque/core'

export type ExtendedSearchResults = SearchResults & {
  relativePathsMap: Record<string, string>
  workspacesMap: Record<string, string>
  groupedMatches: Record<string, MatchWithFileInfo[]>
}

export type Banner = {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  items: Array<
    | { type: 'text'; value: string }
    | { type: 'link'; value: string; link: string }
  >
  userType: 'free' | 'pro' | 'all'
  startDate: Date
  endDate: Date
}

export type SearchFileType =
  | 'all'
  | 'js-ts-json'
  | 'html'
  | 'css'
  | 'python'
  | 'lua'

export type CaseType = 'sensitive' | 'insensitive'
export type QueryType = 'basic' | 'query-builder'
export type ReplaceMode = 'text' | 'merge-code'
export type ReplaceType = 'replace' | 'quick-replace'
