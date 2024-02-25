import { SearchResults, MatchWithFileInfo } from '@codeque/core'

export type CaseType = 'sensitive' | 'insensitive'

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
