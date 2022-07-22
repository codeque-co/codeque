import { Mode, SearchResults, Match } from '@codeque/core'

export type CaseType = 'sensitive' | 'insensitive'

export type Settings = {
  mode: Mode
  caseType: CaseType
}

export type ExtendedSearchResults = SearchResults & {
  relativePathsMap: Record<string, string>
  groupedMatches: Record<string, Match[]>
}
