import { SearchResults, MatchWithFileInfo } from '@codeque/core'

export type CaseType = 'sensitive' | 'insensitive'

export type ExtendedSearchResults = SearchResults & {
  relativePathsMap: Record<string, string>
  groupedMatches: Record<string, MatchWithFileInfo[]>
}
