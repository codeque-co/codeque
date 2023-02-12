import { PoorNodeType, Match, SearchSettingsWithOptionalLogger } from '../types'
import { traverseAndMatch } from './traverseAndMatch'

export const getLocationOfMultilineMatch = (
  match: Match,
  queryNode: PoorNodeType,
  searchSettings: SearchSettingsWithOptionalLogger,
  traverseAndMatchFn: typeof traverseAndMatch,
) => {
  const { blockNodeBodyKey } =
    searchSettings.parserSettings.programNodeAndBlockNodeUtils

  const statements = queryNode[blockNodeBodyKey] as PoorNodeType[]

  const subMatches = statements
    .map(
      (statement) =>
        // we take only first match, as given statement node might be present several times in query
        // But only first occurrence matched during previous search phase
        traverseAndMatchFn(match.node, statement, searchSettings)[0],
    )
    .sort((matchA, matchB) => matchA.start - matchB.end)

  const firstSubMatch = subMatches[0]
  const lastSubMatch = subMatches[subMatches.length - 1]

  return {
    start: firstSubMatch.start,
    end: lastSubMatch.end,
    loc: {
      start: firstSubMatch.loc.start,
      end: lastSubMatch.loc.end,
    },
  } as Match
}
